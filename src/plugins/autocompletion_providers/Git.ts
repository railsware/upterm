import * as Git from "../../utils/Git";
import {
    styles, longAndShortFlag, longFlag, mapSuggestions, unique,
    emptyProvider, SubcommandConfig, commandWithSubcommands, provide,
} from "../autocompletion_utils/Common";
import * as Common from "../autocompletion_utils/Common";
import {combine} from "../autocompletion_utils/Combine";
import {PluginManager} from "../../PluginManager";
import {linedOutputOf, executeCommand} from "../../PTY";
import {find, sortBy, once} from "lodash";
import {homeDirectory} from "../../utils/Common";

const addOptions = combine([
    mapSuggestions(longAndShortFlag("patch"), suggestion => ({...suggestion, description:
        `Interactively choose hunks of patch between the index and the work tree and add them to the index. This gives the user a chance to review the
         difference before adding modified contents to the index.
         This effectively runs add --interactive, but bypasses the initial command menu and directly jumps to the patch subcommand. See "Interactive
         mode" for details.`})),
    mapSuggestions(longFlag("interactive"), suggestion => ({...suggestion, description: `
        Add modified contents in the working tree interactively to the index. Optional path arguments may be supplied to limit operation to a subset
        of the working tree. See "Interactive mode" for details.`})),
]);

function doesLookLikeBranchAlias(word: string) {
    if (!word) return false;
    return word.startsWith("-") || word.includes("@") || word.includes("HEAD") || /\d/.test(word);
}

function canonizeBranchAlias(alias: string) {
    if (alias[0] === "-") {
        const steps = parseInt(alias.slice(1), 10) || 1;
        alias = `@{-${steps}}`;
    }

    return alias;
}

interface OptionData {
    longFlag: string;
    description: string;
    shortFlag?: string;
    noShortFlag?: boolean;
}

const commitOptionsData: OptionData[] = [
    {
        longFlag: "message",
        description: "Use the given <msg> as the commit message. If multiple -m options are given, their values are\
         concatenated as separate paragraphs.",
    },
    {
        longFlag: "all",
        description: "Tell the command to automatically stage files that have been modified and deleted, but new\
         files you have not told Git about are not affected.",
    },
    {
        longFlag: "patch",
        description: "Use the interactive patch selection interface to chose which changes to commit. See\
         git-add(1) for details.",
    },
    {
        longFlag: "null",
        shortFlag: "z",
        description: "When showing short or porcelain status output, terminate entries in the status output\
         with NUL, instead of LF. If no format is given, implies the --porcelain output format.",
    },
    {
        longFlag: "template",
        description: "When editing the commit message, start the editor with the contents in the given file. The\
         commit.template configuration variable is often used to give this option implicitly to the command. This\
         mechanism can be used by projects that want to guide participants with some hints on what to write in the\
         message in what order. If the user exits the editor without editing the message, the commit is aborted. This\
         has no effect when a message is given by other means, e.g. with the -m or -F options.",
    },
    {
        longFlag: "signoff",
        description: "Add Signed-off-by line by the committer at the end of the commit log message. The meaning of\
         a signoff depends on the project, but it typically certifies that committer has the rights to submit this\
         work under the same license and agrees to a Developer Certificate of Origin (see http://\
         developercertificate.org/ for more information).",
    },
    {
        longFlag: "no-verify",
        description: "This option bypasses the pre-commit and commit-msg hooks. See also githooks(5).",
    },
    {
        longFlag: "edit",
        description: "The message taken from file with -F, command line with -m, and from commit object with -C are\
         usually used as the commit log message unmodified. This option lets you further edit the message taken from\
         these sources.",
    },
    {
        longFlag: "include",
        description: "Before making a commit out of staged contents so far, stage the contents of paths given on the\
         command line as well. This is usually not what you want unless you are concluding a conflicted merge.",
    },
    {
        longFlag: "only",
        description: "Make a commit by taking the updated working tree contents of the paths specified on the command\
         line, disregarding any contents that have been staged for other paths. This is the default mode of operation of\
         git commit if any paths are given on the command line, in which case this option can be omitted. If this option\
         is specified together with --amend, then no paths need to be specified, which can be used to amend the last\
         commit without committing changes that have already been staged.",
    },
    {
        longFlag: "verbose",
        description: "Show unified diff between the HEAD commit and what would be committed at the bottom of the commit\
         message template to help the user describe the commit by reminding what changes the commit has. Note that this\
         diff output doesn't have its lines prefixed with #. This diff will not be a part of the commit message. See the\
         commit.verbose configuration variable in git-config(1). If specified twice, show in addition the unified diff\
         between what would be committed and the worktree files, i.e. the unstaged changes to tracked files.",
    },
    {
        longFlag: "quiet",
        description: "Suppress commit summary message.",
    },
    {
        longFlag: "reset-author",
        description: "When used with -C/-c/--amend options, or when committing after a a conflicting cherry-pick,\
         declare that the authorship of the resulting commit now belongs to the committer. This also renews the author timestamp.",
        noShortFlag: true,
    },
    {
        longFlag: "short",
        description: "When doing a dry-run, give the output in the short-format. See git-status(1) for details. Implies --dry-run.",
        noShortFlag: true,
    },
    {
        longFlag: "branch",
        description: "Show the branch and tracking info even in short-format.",
        noShortFlag: true,
    },
    {
        longFlag: "porcelain",
        description: "When doing a dry-run, give the output in a porcelain-ready format. See git-status(1) for details. Implies --dry-run.",
        noShortFlag: true,
    },
    {
        longFlag: "long",
        description: "When doing a dry-run, give the output in a the long-format. Implies --dry-run.",
        noShortFlag: true,
    },
    {
        longFlag: "allow-empty",
        description: "Usually recording a commit that has the exact same tree as its sole parent commit is a mistake,\
         and the command prevents you from making such a commit. This option bypasses the safety, and is primarily for\
         use by foreign SCM interface scripts.",
        noShortFlag: true,
    },
    {
        longFlag: "allow-empty-message",
        description: "Like --allow-empty this command is primarily for use by foreign SCM interface scripts. It allows\
         you to create a commit with an empty commit message without using plumbing commands like git-commit-tree(1).",
        noShortFlag: true,
    },
    {
        longFlag: "no-edit",
        description: "Use the selected commit message without launching an editor. For example, git commit --amend --no-edit amends a commit without changing its commit message.",
        noShortFlag: true,
    },
    {
        longFlag: "no-post-rewrite",
        description: "Bypass the post-rewrite hook.",
        noShortFlag: true,
    },
    {
        longFlag: "dry-run",
        description: "Do not create a commit, but show a list of paths that are to be committed, paths with local changes that will be left uncommitted and paths that are untracked.",
        noShortFlag: true,
    },
    {
        longFlag: "status",
        description: "Include the output of git-status(1) in the commit message template when using an editor to\
         prepare the commit message. Defaults to on, but can be used to override configuration variable commit.status.",
        noShortFlag: true,
    },
    {
        longFlag: "no-status",
        description: "Do not include the output of git-status(1) in the commit message template when using an editor to prepare the default commit message.",
        noShortFlag: true,
    },
    {
        longFlag: "no-gpg-sign",
        description: "Countermand commit.gpgSign configuration variable that is set to force each and every commit to be signed.",
        noShortFlag: true,
    },
];

const commitOptions = combine(commitOptionsData.map(({ longFlag, shortFlag, noShortFlag, description }) => {
    const provider = noShortFlag ? Common.longFlag(longFlag) : longAndShortFlag(longFlag, shortFlag);
    return mapSuggestions(provider, suggestion => ({...suggestion, description}));
}));

const pushOptions = combine([
    longFlag("force-with-lease"),
]);

const statusOptions = combine([
    longFlag("short"),
]);

const configOptions = combine([
    longFlag("global"),
    longFlag("system"),
    longAndShortFlag("list"),
    longAndShortFlag("edit"),
]);

const fetchOptions = combine([
    "quiet",
    "verbose",
    "append",
    "upload-pack",
    "force",
    "keep",
    "depth=",
    "tags",
    "no-tags",
    "all",
    "prune",
    "dry-run",
    "recurse-submodules=",
].map(longFlag));

const commonMergeOptions = combine([
    "no-commit",
    "no-stat",
    "log",
    "no-log",
    "squash",
    "strategy",
    "commit",
    "stat",
    "no-squash",
    "ff",
    "no-ff",
    "ff-only",
    "edit",
    "no-edit",
    "verify-signatures",
    "no-verify-signatures",
    "gpg-sign",
    "quiet",
    "verbose",
    "progress",
    "no-progress",
].map(longFlag));

const remotes = provide(async context => {
    if (Git.isGitDirectory(context.environment.pwd)) {
        const names = await Git.remotes(context.environment.pwd);
        return names.map(name => ({label: name, style: styles.branch}));
    }

    return [];
});

const configVariables = unique(provide(async context => {
    const variables = await Git.configVariables(context.environment.pwd);

    return variables.map(variable => ({label: variable.name, description: variable.value, style: styles.option}));
}));

const branchesExceptCurrent = provide(async context => {
    if (Git.isGitDirectory(context.environment.pwd)) {
        const allBranches = (await Git.branches({
            directory: context.environment.pwd,
            remotes: true,
            tags: false,
        }));
        const nonCurrentBranches = allBranches.filter(branch => !branch.isCurrent());
        return nonCurrentBranches.map(branch => ({label: branch.toString(), style: styles.branch}));
    } else {
        return [];
    }
});

const branchAlias = provide(async context => {
    if (doesLookLikeBranchAlias(context.argument.value)) {
        let nameOfAlias = (await linedOutputOf("git", ["name-rev", "--name-only", canonizeBranchAlias(context.argument.value)], context.environment.pwd))[0];
        if (nameOfAlias && !nameOfAlias.startsWith("Could not get")) {
            return [{label: context.argument.value, synopsis: nameOfAlias, style: styles.branch}];
        }
    }

    return [];
});

const notStagedFiles = unique(provide(async context => {
    if (Git.isGitDirectory(context.environment.pwd)) {
        const fileStatuses = await Git.status(context.environment.pwd);
        return fileStatuses.map(fileStatus => ({label: fileStatus.value, style: styles.gitFileStatus(fileStatus.code)}));
    } else {
        return [];
    }
}));

const commandsData: SubcommandConfig[] = [
    {
        name: "add",
        description: "Add file contents to the index.",
        provider: combine([notStagedFiles, addOptions]),
    },
    {
        name: "am",
        description: "Apply a series of patches from a mailbox.",
        provider: emptyProvider,
    },
    {
        name: "archive",
        description: "Create an archive of files from a named tree.",
        provider: emptyProvider,
    },
    {
        name: "bisect",
        description: "Find by binary search the change that introduced a bug.",
        provider: emptyProvider,
    },
    {
        name: "branch",
        description: "List, create, or delete branches.",
        provider: branchesExceptCurrent,
    },
    {
        name: "bundle",
        description: "Move objects and refs by archive.",
        provider: emptyProvider,
    },
    {
        name: "checkout",
        description: "Switch branches or restore working tree files.",
        provider: combine([branchesExceptCurrent, branchAlias, notStagedFiles]),
    },
    {
        name: "cherry-pick",
        description: "Apply the changes introduced by some existing commits.",
        provider: emptyProvider,
    },
    {
        name: "citool",
        description: "Graphical alternative to git-commit.",
        provider: emptyProvider,
    },
    {
        name: "clean",
        description: "Remove untracked files from the working tree.",
        provider: emptyProvider,
    },
    {
        name: "clone",
        description: "Clone a repository into a new directory.",
        provider: emptyProvider,
    },
    {
        name: "commit",
        description: "Record changes to the repository.",
        provider: commitOptions,
    },
    {
        name: "config",
        description: "Get and set repository or global options",
        provider: combine([configVariables, configOptions]),
    },
    {
        name: "describe",
        description: "Describe a commit using the most recent tag reachable from it.",
        provider: emptyProvider,
    },
    {
        name: "diff",
        description: "Show changes between commits, commit and working tree, etc.",
        provider: emptyProvider,
    },
    {
        name: "fetch",
        description: "Download objects and refs from another repository.",
        provider: combine([remotes, fetchOptions]),
    },
    {
        name: "format-patch",
        description: "Prepare patches for e-mail submission.",
        provider: emptyProvider,
    },
    {
        name: "gc",
        description: "Cleanup unnecessary files and optimize the local repository.",
        provider: emptyProvider,
    },
    {
        name: "grep",
        description: "Print lines matching a pattern.",
        provider: emptyProvider,
    },
    {
        name: "gui",
        description: "A portable graphical interface to Git.",
        provider: emptyProvider,
    },
    {
        name: "init",
        description: "Create an empty Git repository or reinitialize an existing one.",
        provider: emptyProvider,
    },
    {
        name: "log",
        description: "Show commit logs.",
        provider: emptyProvider,
    },
    {
        name: "merge",
        description: "Join two or more development histories together.",
        provider: combine([
            branchesExceptCurrent,
            branchAlias,
            commonMergeOptions,
            longFlag("rerere-autoupdate"),
            longFlag("no-rerere-autoupdate"),
            longFlag("abort"),
        ]),
    },
    {
        name: "mv",
        description: "Move or rename a file, a directory, or a symlink.",
        provider: emptyProvider,
    },
    {
        name: "notes",
        description: "Add or inspect object notes.",
        provider: emptyProvider,
    },
    {
        name: "pull",
        description: "Fetch from and integrate with another repository or a local branch.",
        provider: combine([
            longFlag("rebase"),
            longFlag("no-rebase"),
            commonMergeOptions,
            fetchOptions,
        ]),
    },
    {
        name: "push",
        description: "Update remote refs along with associated objects.",
        provider: pushOptions,
    },
    {
        name: "rebase",
        description: "Forward-port local commits to the updated upstream head.",
        provider: emptyProvider,
    },
    {
        name: "reset",
        description: "Reset current HEAD to the specified state.",
        provider: emptyProvider,
    },
    {
        name: "revert",
        description: "Revert some existing commits.",
        provider: emptyProvider,
    },
    {
        name: "rm",
        description: "Remove files from the working tree and from the index.",
        provider: emptyProvider,
    },
    {
        name: "shortlog",
        description: "Summarize git log output.",
        provider: emptyProvider,
    },
    {
        name: "show",
        description: "Show various types of objects.",
        provider: emptyProvider,
    },
    {
        name: "stash",
        description: "Stash the changes in a dirty working directory away.",
        provider: emptyProvider,
    },
    {
        name: "status",
        description: "Show the working tree status.",
        provider: statusOptions,
    },
    {
        name: "submodule",
        description: "Initialize, update or inspect submodules.",
        provider: emptyProvider,
    },
    {
        name: "tag",
        description: "Create, list, delete or verify a tag object signed with GPG.",
        provider: emptyProvider,
    },
    {
        name: "worktree",
        description: "Manage multiple worktrees.",
        provider: emptyProvider,
    },
];

const commands = once(async(): Promise<SubcommandConfig[]> => {
    const text = await executeCommand("git", ["help", "-a"], homeDirectory);
    const matches: string[] | null = text.match(/  ([\-a-zA-Z0-9]+)/gm);

    if (matches) {
        const suggestions = matches
            .filter(match => match.indexOf("--") === -1)
            .map(match => {
                const name = match.trim();
                const data = find(commandsData, {name});

                return {
                    name,
                    description: data ? data.description : "",
                    provider: data ? data.provider : emptyProvider,
                };
            });

        return sortBy(suggestions, suggestion => !suggestion.description);
    }

    return [];
});

const aliases = once(async(): Promise<SubcommandConfig[]> => {
    const aliasList = await Git.aliases(homeDirectory);
    return aliasList.map(({ name, value }) => {
        let result: SubcommandConfig = {
            name: name,
            synopsis: value,
            style: styles.alias,
        };

        const expandedAliasConfig = find(commandsData, data => data.name === value);
        if (expandedAliasConfig && expandedAliasConfig.provider) {
            result.provider = expandedAliasConfig.provider;
        }

        return result;
    });
});

PluginManager.registerAutocompletionProvider("git", async context => {
    const allCommands = [...(await aliases()), ...(await commands())];
    return commandWithSubcommands(allCommands)(context);
});
