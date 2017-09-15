import * as Git from "../../utils/Git";
import {
    commandWithSubcommands,
    emptyProvider,
    longFlag,
    provide,
    staticSuggestionsProvider,
    SubcommandConfig,
    Suggestion,
    unique,
} from "../autocompletion_utils/Common";
import {combine} from "../autocompletion_utils/Combine";
import {PluginManager} from "../../PluginManager";
import {executeCommand, linedOutputOf} from "../../PTY";
import {find, once, sortBy} from "lodash";
import {homeDirectory} from "../../utils/Common";
import {descriptions} from "../autocompletion_utils/Descriptions";

const addOptions: Suggestion[] = [
    {
        label: "--patch",
        detail: descriptions.git.add.patch,
    },
    {
        label: "-p",
        detail: descriptions.git.add.patch,
    },
    {
        label: "--interactive",
        detail: descriptions.git.add.interactive,
    },
];

const commitOptions: Suggestion[] = [
    {
        label: "--message",
        detail: descriptions.git.commit.message,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: {value: "--message \"${0:Commit message}\""},
    },
    {
        label: "-m",
        detail: descriptions.git.commit.message,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: {value: "-m \"${0:Commit message}\""},
    },
    {
        label: "--all",
        detail: descriptions.git.commit.all,
    },
    {
        label: "-a",
        detail: descriptions.git.commit.all,
    },
    {
        label: "--patch",
        detail: descriptions.git.commit.patch,
    },
    {
        label: "-p",
        detail: descriptions.git.commit.patch,
    },
    {
        label: "--null",
        detail: descriptions.git.commit.NULL,
    },
    {
        label: "-z",
        detail: descriptions.git.commit.NULL,
    },
    {
        label: "--template",
        detail: descriptions.git.commit.template,
    },
    {
        label: "-t",
        detail: descriptions.git.commit.template,
    },
    {
        label: "--signoff",
        detail: descriptions.git.commit.signoff,
    },
    {
        label: "-s",
        detail: descriptions.git.commit.signoff,
    },
    {
        label: "--no-verify",
        detail: descriptions.git.commit.noVerify,
    },
    {
        label: "-n",
        detail: descriptions.git.commit.noVerify,
    },
    {
        label: "--edit",
        detail: descriptions.git.commit.edit,
    },
    {
        label: "-e",
        detail: descriptions.git.commit.edit,
    },
    {
        label: "--include",
        detail: descriptions.git.commit.include,
    },
    {
        label: "-i",
        detail: descriptions.git.commit.include,
    },
    {
        label: "--only",
        detail: descriptions.git.commit.only,
    },
    {
        label: "-o",
        detail: descriptions.git.commit.only,
    },
    {
        label: "--verbose",
        detail: descriptions.git.commit.verbose,
    },
    {
        label: "-v",
        detail: descriptions.git.commit.verbose,
    },
    {
        label: "--quiet",
        detail: descriptions.git.commit.quiet,
    },
    {
        label: "-q",
        detail: descriptions.git.commit.quiet,
    },
    {
        label: "--reset-author",
        detail: descriptions.git.commit.resetAuthor,
    },
    {
        label: "--short",
        detail: descriptions.git.commit.short,
    },
    {
        label: "--branch",
        detail: descriptions.git.commit.branch,
    },
    {
        label: "--porcelain",
        detail: descriptions.git.commit.porcelain,
    },
    {
        label: "--long",
        detail: descriptions.git.commit.long,
    },
    {
        label: "--allow-empty",
        detail: descriptions.git.commit.allowEmpty,
    },
    {
        label: "--allow-empty-message",
        detail: descriptions.git.commit.allowEmptyMessage,
    },
    {
        label: "--no-edit",
        detail: descriptions.git.commit.noEdit,
    },
    {
        label: "--no-post-rewrite",
        detail: descriptions.git.commit.noPostRewrite,
    },
    {
        label: "--dry-run",
        detail: descriptions.git.commit.dryRun,
    },
    {
        label: "--status",
        detail: descriptions.git.commit.status,
    },
    {
        label: "--no-status",
        detail: descriptions.git.commit.noStatus,
    },
    {
        label: "--no-gpg-sign",
        detail: descriptions.git.commit.noGpgSign,
    },
];

const pushOptions: Suggestion[] = [
    {
        label: "--force-with-lease",
        detail: descriptions.git.commit.noGpgSign,
    },
];

const resetOptions: Suggestion[] = [
    {
        label: "--soft",
    },
    {
        label: "--mixed",
    },
    {
        label: "--hard",
    },
    {
        label: "--merge",
    },
    {
        label: "--keep",
    },
];

const statusOptions: Suggestion[] = [
    {
        label: "--short",
    },
];

const configOptions: Suggestion[] = [
    {
        label: "--global",
    },
    {
        label: "--system",
    },
    {
        label: "--list",
    },
    {
        label: "-l",
    },
    {
        label: "--edit",
    },
    {
        label: "-e",
    },
];

const fetchOptions: Suggestion[] = [
    {
        label: "--quiet",
    },
    {
        label: "--verbose",
    },
    {
        label: "--append",
    },
    {
        label: "--upload-pack",
    },
    {
        label: "--force",
    },
    {
        label: "--keep",
    },
    {
        label: "--depth=",
    },
    {
        label: "--tags",
    },
    {
        label: "--no-tags",
    },
    {
        label: "--all",
    },
    {
        label: "--prune",
    },
    {
        label: "--dry-run",
    },
    {
        label: "--recurse-submodules=",
    },
];

const commonMergeOptions: Suggestion[] = [
    {
        label: "--no-commit",
    },
    {
        label: "--no-stat",
    },
    {
        label: "--log",
    },
    {
        label: "--no-log",
    },
    {
        label: "--squash",
    },
    {
        label: "--strategy",
    },
    {
        label: "--commit",
    },
    {
        label: "--stat",
    },
    {
        label: "--no-squash",
    },
    {
        label: "--ff",
    },
    {
        label: "--no-ff",
    },
    {
        label: "--ff-only",
    },
    {
        label: "--edit",
    },
    {
        label: "--no-edit",
    },
    {
        label: "--verify-signatures",
    },
    {
        label: "--no-verify-signatures",
    },
    {
        label: "--gpg-sign",
    },
    {
        label: "--quiet",
    },
    {
        label: "--verbose",
    },
    {
        label: "--progress",
    },
    {
        label: "--no-progress",
    },
];

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

const remotes = provide(async context => {
    if (Git.isGitDirectory(context.environment.pwd)) {
        const names = await Git.remotes(context.environment.pwd);
        return names.map(name => ({label: name}));
    }

    return [];
});

const configVariables = unique(provide(async context => {
    const variables = await Git.configVariables(context.environment.pwd);

    return variables.map(variable => ({label: variable.name, detail: variable.value}));
}));

const branchesExceptCurrent = provide(async context => {
    if (Git.isGitDirectory(context.environment.pwd)) {
        const allBranches = (await Git.branches({
            directory: context.environment.pwd,
            remotes: true,
            tags: false,
        }));
        const nonCurrentBranches = allBranches.filter(branch => !branch.isCurrent());
        return nonCurrentBranches.map(branch => ({label: branch.toString()}));
    } else {
        return [];
    }
});

const branchAlias = provide(async context => {
    if (doesLookLikeBranchAlias(context.argument.value)) {
        let nameOfAlias = (await linedOutputOf("git", ["name-rev", "--name-only", canonizeBranchAlias(context.argument.value)], context.environment.pwd))[0];
        if (nameOfAlias && !nameOfAlias.startsWith("Could not get")) {
            return [{label: context.argument.value, detail: nameOfAlias}];
        }
    }

    return [];
});

const notStagedFiles = unique(provide(async context => {
    if (Git.isGitDirectory(context.environment.pwd)) {
        const fileStatuses = await Git.status(context.environment.pwd);
        return fileStatuses.map(fileStatus => ({label: fileStatus.value}));
    } else {
        return [];
    }
}));

const commandsData: SubcommandConfig[] = [
    {
        name: "add",
        detail: "Add file contents to the index.",
        provider: combine([notStagedFiles, staticSuggestionsProvider(addOptions)]),
    },
    {
        name: "am",
        detail: "Apply a series of patches from a mailbox.",
        provider: emptyProvider,
    },
    {
        name: "archive",
        detail: "Create an archive of files from a named tree.",
        provider: emptyProvider,
    },
    {
        name: "bisect",
        detail: "Find by binary search the change that introduced a bug.",
        provider: emptyProvider,
    },
    {
        name: "branch",
        detail: "List, create, or delete branches.",
        provider: branchesExceptCurrent,
    },
    {
        name: "bundle",
        detail: "Move objects and refs by archive.",
        provider: emptyProvider,
    },
    {
        name: "checkout",
        detail: "Switch branches or restore working tree files.",
        provider: combine([branchesExceptCurrent, branchAlias, notStagedFiles]),
    },
    {
        name: "cherry-pick",
        detail: "Apply the changes introduced by some existing commits.",
        provider: emptyProvider,
    },
    {
        name: "citool",
        detail: "Graphical alternative to git-commit.",
        provider: emptyProvider,
    },
    {
        name: "clean",
        detail: "Remove untracked files from the working tree.",
        provider: emptyProvider,
    },
    {
        name: "clone",
        detail: "Clone a repository into a new directory.",
        provider: emptyProvider,
    },
    {
        name: "commit",
        detail: "Record changes to the repository.",
        provider: staticSuggestionsProvider(commitOptions),
    },
    {
        name: "config",
        detail: "Get and set repository or global options",
        provider: combine([configVariables, staticSuggestionsProvider(configOptions)]),
    },
    {
        name: "describe",
        detail: "Describe a commit using the most recent tag reachable from it.",
        provider: emptyProvider,
    },
    {
        name: "diff",
        detail: "Show changes between commits, commit and working tree, etc.",
        provider: emptyProvider,
    },
    {
        name: "fetch",
        detail: "Download objects and refs from another repository.",
        provider: combine([remotes, staticSuggestionsProvider(fetchOptions)]),
    },
    {
        name: "format-patch",
        detail: "Prepare patches for e-mail submission.",
        provider: emptyProvider,
    },
    {
        name: "gc",
        detail: "Cleanup unnecessary files and optimize the local repository.",
        provider: emptyProvider,
    },
    {
        name: "grep",
        detail: "Print lines matching a pattern.",
        provider: emptyProvider,
    },
    {
        name: "gui",
        detail: "A portable graphical interface to Git.",
        provider: emptyProvider,
    },
    {
        name: "init",
        detail: "Create an empty Git repository or reinitialize an existing one.",
        provider: emptyProvider,
    },
    {
        name: "log",
        detail: "Show commit logs.",
        provider: emptyProvider,
    },
    {
        name: "merge",
        detail: "Join two or more development histories together.",
        provider: combine([
            branchesExceptCurrent,
            branchAlias,
            staticSuggestionsProvider(commonMergeOptions),
            longFlag("rerere-autoupdate"),
            longFlag("no-rerere-autoupdate"),
            longFlag("abort"),
        ]),
    },
    {
        name: "mv",
        detail: "Move or rename a file, a directory, or a symlink.",
        provider: emptyProvider,
    },
    {
        name: "notes",
        detail: "Add or inspect object notes.",
        provider: emptyProvider,
    },
    {
        name: "pull",
        detail: "Fetch from and integrate with another repository or a local branch.",
        provider: combine([
            longFlag("rebase"),
            longFlag("no-rebase"),
            staticSuggestionsProvider(commonMergeOptions),
            staticSuggestionsProvider(fetchOptions),
        ]),
    },
    {
        name: "push",
        detail: "Update remote refs along with associated objects.",
        provider: staticSuggestionsProvider(pushOptions),
    },
    {
        name: "rebase",
        detail: "Forward-port local commits to the updated upstream head.",
        provider: emptyProvider,
    },
    {
        name: "reset",
        detail: "Reset current HEAD to the specified state.",
        provider: staticSuggestionsProvider(resetOptions),
    },
    {
        name: "revert",
        detail: "Revert some existing commits.",
        provider: emptyProvider,
    },
    {
        name: "rm",
        detail: "Remove files from the working tree and from the index.",
        provider: emptyProvider,
    },
    {
        name: "shortlog",
        detail: "Summarize git log output.",
        provider: emptyProvider,
    },
    {
        name: "show",
        detail: "Show various types of objects.",
        provider: emptyProvider,
    },
    {
        name: "stash",
        detail: "Stash the changes in a dirty working directory away.",
        provider: emptyProvider,
    },
    {
        name: "status",
        detail: "Show the working tree status.",
        provider: staticSuggestionsProvider(statusOptions),
    },
    {
        name: "submodule",
        detail: "Initialize, update or inspect submodules.",
        provider: emptyProvider,
    },
    {
        name: "tag",
        detail: "Create, list, delete or verify a tag object signed with GPG.",
        provider: emptyProvider,
    },
    {
        name: "worktree",
        detail: "Manage multiple worktrees.",
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
                    detail: data ? data.detail : "",
                    provider: data ? data.provider : emptyProvider,
                };
            });

        return sortBy(suggestions, suggestion => !suggestion.detail);
    }

    return [];
});

const aliases = once(async(): Promise<SubcommandConfig[]> => {
    const aliasList = await Git.aliases(homeDirectory);
    return aliasList.map(({ name, value }) => {
        let result: SubcommandConfig = {
            name: name,
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
