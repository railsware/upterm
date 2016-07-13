import * as Git from "../../utils/Git";
import {styles, Suggestion, longAndShortFlag, longFlag, mapSuggestions, combine, unique} from "./Common";
import {PluginManager} from "../../PluginManager";
import {AutocompletionProvider, AutocompletionContext} from "../../Interfaces";
import {linedOutputOf, executeCommand} from "../../PTY";
import {find, flatMap} from 'lodash';

async function loadAllSubcommands() {
    const text = await executeCommand("git", ["help", "-a"], process.env.HOME);
    const matches = text.match(/  ([\-a-zA-Z0-9]+)/gm);

    if (matches) {
        matches
            .filter((match) => match.indexOf("--") === -1)
            .forEach(async(match) => {
                const name = match.trim();
                const data = find(subCommandsData, {name});

                if (!data) {
                    subCommandsData.push({
                        name,
                        description: '',
                        aliases: [],
                    });
                }
            });
    }
}

async function loadAliases() {
    const variables = await Git.configVariables(process.env.HOME);

    variables
        .filter(variable => variable.name.indexOf("alias.") === 0)
        .forEach(variable => {
            const name = variable.name.replace("alias.", "");
            const data = find(subCommandsData, {name: variable.value});

            if (data) {
                data.aliases.push(name);
            } else {
                subCommandsData.push({
                    name: name,
                    description: variable.value,
                    aliases: [],
                });
            }
        });
}

loadAllSubcommands();
loadAliases();


const addOptions = combine([
    mapSuggestions(longAndShortFlag("patch"), suggestion => suggestion.withDescription(
        `Interactively choose hunks of patch between the index and the work tree and add them to the index. This gives the user a chance to review the
         difference before adding modified contents to the index.
         This effectively runs add --interactive, but bypasses the initial command menu and directly jumps to the patch subcommand. See "Interactive
         mode" for details.`)),
    mapSuggestions(longFlag("interactive"), suggestion => suggestion.withDescription(`
        Add modified contents in the working tree interactively to the index. Optional path arguments may be supplied to limit operation to a subset
        of the working tree. See "Interactive mode" for details.`)),
]);

function doesLookLikeBranchAlias(word:string) {
    if (!word) return false;
    return word.startsWith("-") || word.includes("@") || word.includes("HEAD") || /\d/.test(word);
}

function canonizeBranchAlias(alias:string) {
    if (alias[0] === "-") {
        const steps = parseInt(alias.slice(1), 10) || 1;
        alias = `@{-${steps}}`;
    }

    return alias;
}

const commitOptions = combine([
    mapSuggestions(longAndShortFlag("message"), suggestion => suggestion.withDescription(
        "Use the given <msg> as the commit message. If multiple -m options are given, their values are concatenated as separate paragraphs."
    )),
]);

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
].map(option => longFlag(option)));

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
].map(option => longFlag(option)));

const remotes = async(context:AutocompletionContext):Promise<Suggestion[]> => {
    if (Git.isGitDirectory(context.environment.pwd)) {
        const names = await Git.remotes(context.environment.pwd);
        return names.map(name => new Suggestion().withValue(name).withStyle(styles.branch));
    }

    return [];
};

const configVariables = unique(async(context:AutocompletionContext):Promise<Suggestion[]> => {
    const variables = await Git.configVariables(context.environment.pwd);

    return variables.map((variable) => {
            return new Suggestion()
                .withValue(variable.name)
                .withDescription(variable.value)
                .withStyle(styles.option);
        }
    );
});

const branchesExceptCurrent = async(context:AutocompletionContext):Promise<Suggestion[]> => {
    if (Git.isGitDirectory(context.environment.pwd)) {
        const branches = (await Git.branches(context.environment.pwd)).filter(branch => !branch.isCurrent());
        return branches.map(branch => new Suggestion().withValue(branch.toString()).withStyle(styles.branch));
    } else {
        return [];
    }
};

const branchAlias = async(context:AutocompletionContext):Promise<Suggestion[]> => {
    if (doesLookLikeBranchAlias(context.argument.value)) {
        let nameOfAlias = (await linedOutputOf("git", ["name-rev", "--name-only", canonizeBranchAlias(context.argument.value)], context.environment.pwd))[0];
        if (nameOfAlias && !nameOfAlias.startsWith("Could not get")) {
            return [new Suggestion().withValue(context.argument.value).withSynopsis(nameOfAlias).withStyle(styles.branch)];
        }
    }

    return [];
};

const notStagedFiles = unique(async(context:AutocompletionContext):Promise<Suggestion[]> => {
    if (Git.isGitDirectory(context.environment.pwd)) {
        const fileStatuses = await Git.status(context.environment.pwd);
        return fileStatuses.map(fileStatus => new Suggestion().withValue(fileStatus.value).withStyle(styles.gitFileStatus(fileStatus.code)));
    } else {
        return [];
    }
});

interface GitCommandData {
    name:string;
    description:string;
    provider?:AutocompletionProvider;
    aliases:string[];
}

const subCommandsData:GitCommandData[] = [
    {
        name: "add",
        description: "Add file contents to the index.",
        provider: combine([notStagedFiles, addOptions]),
        aliases: [],
    },
    {
        name: "am",
        description: "Apply a series of patches from a mailbox.",
        aliases: [],
    },
    {
        name: "archive",
        description: "Create an archive of files from a named tree.",
        aliases: [],
    },
    {
        name: "bisect",
        description: "Find by binary search the change that introduced a bug.",
        aliases: [],
    },
    {
        name: "branch",
        description: "List, create, or delete branches.",
        aliases: [],
    },
    {
        name: "bundle",
        description: "Move objects and refs by archive.",
        aliases: [],
    },
    {
        name: "checkout",
        description: "Switch branches or restore working tree files.",
        provider: combine([branchesExceptCurrent, branchAlias, notStagedFiles]),
        aliases: [],
    },
    {
        name: "cherry-pick",
        description: "Apply the changes introduced by some existing commits.",
        aliases: [],
    },
    {
        name: "citool",
        description: "Graphical alternative to git-commit.",
        aliases: [],
    },
    {
        name: "clean",
        description: "Remove untracked files from the working tree.",
        aliases: [],
    },
    {
        name: "clone",
        description: "Clone a repository into a new directory.",
        aliases: [],
    },
    {
        name: "commit",
        description: "Record changes to the repository.",
        provider: commitOptions,
        aliases: [],
    },
    {
        name: "config",
        description: "Get and set repository or global options",
        provider: combine([configVariables, configOptions]),
        aliases: [],
    },
    {
        name: "describe",
        description: "Describe a commit using the most recent tag reachable from it.",
        aliases: [],
    },
    {
        name: "diff",
        description: "Show changes between commits, commit and working tree, etc.",
        aliases: [],
    },
    {
        name: "fetch",
        description: "Download objects and refs from another repository.",
        provider: combine([remotes, fetchOptions]),
        aliases: [],
    },
    {
        name: "format-patch",
        description: "Prepare patches for e-mail submission.",
        aliases: [],
    },
    {
        name: "gc",
        description: "Cleanup unnecessary files and optimize the local repository.",
        aliases: [],
    },
    {
        name: "grep",
        description: "Print lines matching a pattern.",
        aliases: [],
    },
    {
        name: "gui",
        description: "A portable graphical interface to Git.",
        aliases: [],
    },
    {
        name: "init",
        description: "Create an empty Git repository or reinitialize an existing one.",
        aliases: [],
    },
    {
        name: "log",
        description: "Show commit logs.",
        aliases: [],
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
        aliases: [],
    },
    {
        name: "mv",
        description: "Move or rename a file, a directory, or a symlink.",
        aliases: [],
    },
    {
        name: "notes",
        description: "Add or inspect object notes.",
        aliases: [],
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
        aliases: [],
    },
    {
        name: "push",
        description: "Update remote refs along with associated objects.",
        provider: pushOptions,
        aliases: [],
    },
    {
        name: "rebase",
        description: "Forward-port local commits to the updated upstream head.",
        aliases: [],
    },
    {
        name: "reset",
        description: "Reset current HEAD to the specified state.",
        aliases: [],
    },
    {
        name: "revert",
        description: "Revert some existing commits.",
        aliases: [],
    },
    {
        name: "rm",
        description: "Remove files from the working tree and from the index.",
        aliases: [],
    },
    {
        name: "shortlog",
        description: "Summarize git log output.",
        aliases: [],
    },
    {
        name: "show",
        description: "Show various types of objects.",
        aliases: [],
    },
    {
        name: "stash",
        description: "Stash the changes in a dirty working directory away.",
        aliases: [],
    },
    {
        name: "status",
        description: "Show the working tree status.",
        provider: statusOptions,
        aliases: [],
    },
    {
        name: "submodule",
        description: "Initialize, update or inspect submodules.",
        aliases: [],
    },
    {
        name: "tag",
        description: "Create, list, delete or verify a tag object signed with GPG.",
        aliases: [],
    },
    {
        name: "worktree",
        description: "Manage multiple worktrees.",
        aliases: [],
    },
];

PluginManager.registerAutocompletionProvider("git", context => {
    if (context.argument.position === 1) {
        return flatMap(subCommandsData, data => {
            const result = [
                new Suggestion()
                    .withValue(data.name)
                    .withDescription(data.description)
                    .withStyle(styles.command)
                    .withSpace()
            ];

            data.aliases.forEach(name => {
                const aliasSuggestion = new Suggestion()
                    .withValue(name)
                    .withDescription(data.description)
                    .withStyle(styles.command)
                    .withSpace();

                result.push(aliasSuggestion);
            });

            return result;
        });
    } else {
        const firstArgument = context.argument.command.nthArgument(1);

        if (firstArgument) {
            const data = find(subCommandsData, (data) => {
                if (data.name === firstArgument.value) {
                    return true;
                }

                return data.aliases.indexOf(firstArgument.value) !== -1;
            });

            if (data && data.provider) {
                return data.provider(context);
            } else {
                return [];
            }
        } else {
            throw "Has no first argument.";
        }
    }
});
