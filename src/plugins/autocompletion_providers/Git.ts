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
        label: "-p",
        detail: descriptions.git.add.patch,
    },
    {
        label: "--patch",
        detail: descriptions.git.add.patch,
    },
    {
        label: "-i",
        detail: descriptions.git.add.interactive,
    },
    {
        label: "--interactive",
        detail: descriptions.git.add.interactive,
    },
    {
        label: "-n",
        detail: descriptions.git.add.dryRun,
    },
    {
        label: "--dry-run",
        detail: descriptions.git.add.dryRun,
    },
    {
        label: "-v",
        detail: descriptions.git.add.verbose,
    },
    {
        label: "--verbose",
    },
    {
        label: "-f",
        detail: descriptions.git.add.force,
    },
    {
        label: "--force",
        detail: descriptions.git.add.force,
    },
    {
        label: "-e",
        detail: descriptions.git.add.edit,
    },
    {
        label: "--edit",
        detail: descriptions.git.add.edit,
    },
    {
        label: "-u",
        detail: descriptions.git.add.update,
    },
    {
        label: "--update",
        detail: descriptions.git.add.update,
    },
    {
        label: "-A",
        detail: descriptions.git.add.noIgnoreRemoval,
    },
    {
        label: "--all",
        detail: descriptions.git.add.noIgnoreRemoval,
    },
    {
        label: "--no-ignore-removal",
        detail: descriptions.git.add.noIgnoreRemoval,
    },
    {
        label: "--no-all",
        detail: descriptions.git.add.ignoreRemoval,
    },
    {
        label: "--ignore-removal",
        detail: descriptions.git.add.ignoreRemoval,
    },
    {
        label: "-N",
        detail: descriptions.git.add.intentToAdd,
    },
    {
        label: "--intent-to-add",
        detail: descriptions.git.add.intentToAdd,
    },
    {
        label: "--refresh",
        detail: descriptions.git.add.refresh,
    },
    {
        label: "--ignore-errors",
        detail: descriptions.git.add.ignoreErrors,
    },
    {
        label: "--ignore-missing",
        detail: descriptions.git.add.ignoreMissing,
    },
    {
        label: "--chmod=",
        detail: descriptions.git.add.chmod,
    },
    {
        label: "--",
        detail: descriptions.git.add.separator,
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
        label: "-s",
        detail: descriptions.git.status.short,
    },
    {
        label: "--short",
        detail: descriptions.git.status.short,
    },
    {
        label: "-b",
        detail: descriptions.git.status.branch,
    },
    {
        label: "--branch",
        detail: descriptions.git.status.branch,
    },
    {
        label: "--porcelain",
        detail: descriptions.git.status.porcelain,
    },
    {
        label: "--long",
        detail: descriptions.git.status.long,
    },
    {
        label: "-v",
        detail: descriptions.git.status.verbose,
    },
    {
        label: "--verbose",
        detail: descriptions.git.status.verbose,
    },
    {
        label: "-u",
        detail: descriptions.git.status.untrackedFiles,
    },
    {
        label: "--untracked-files",
        detail: descriptions.git.status.untrackedFiles,
    },
    {
        label: "--ignore-submodules",
        detail: descriptions.git.status.ignoreSubmodules,
    },
    {
        label: "--ignored",
        detail: descriptions.git.status.ignored,
    },
    {
        label: "-z",
        detail: descriptions.git.status.terminateWithNull,
    },
    {
        label: "--column",
        detail: descriptions.git.status.column,
    },
    {
        label: "--no-column",
        detail: descriptions.git.status.column,
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
        detail: descriptions.git.subcommands.add,
        provider: combine([notStagedFiles, staticSuggestionsProvider(addOptions)]),
    },
    {
        name: "am",
        detail: descriptions.git.subcommands.am,
    },
    {
        name: "archive",
        detail: descriptions.git.subcommands.archive,
    },
    {
        name: "bisect",
        detail: descriptions.git.subcommands.bisect,
    },
    {
        name: "branch",
        detail: descriptions.git.subcommands.branch,
        provider: branchesExceptCurrent,
    },
    {
        name: "bundle",
        detail: descriptions.git.subcommands.bundle,
    },
    {
        name: "checkout",
        detail: descriptions.git.subcommands.checkout,
        provider: combine([branchesExceptCurrent, branchAlias, notStagedFiles]),
    },
    {
        name: "cherry-pick",
        detail: descriptions.git.subcommands.cherryPick,
    },
    {
        name: "citool",
        detail: descriptions.git.subcommands.citool,
    },
    {
        name: "clean",
        detail: descriptions.git.subcommands.clean,
    },
    {
        name: "clone",
        detail: descriptions.git.subcommands.clone,
    },
    {
        name: "commit",
        detail: descriptions.git.subcommands.commit,
        provider: staticSuggestionsProvider(commitOptions),
    },
    {
        name: "config",
        detail: descriptions.git.subcommands.config,
        provider: combine([configVariables, staticSuggestionsProvider(configOptions)]),
    },
    {
        name: "describe",
        detail: descriptions.git.subcommands.describe,
    },
    {
        name: "diff",
        detail: descriptions.git.subcommands.diff,
    },
    {
        name: "fetch",
        detail: descriptions.git.subcommands.fetch,
        provider: combine([remotes, staticSuggestionsProvider(fetchOptions)]),
    },
    {
        name: "format-patch",
        detail: descriptions.git.subcommands.formatPatch,
    },
    {
        name: "gc",
        detail: descriptions.git.subcommands.gc,
    },
    {
        name: "grep",
        detail: descriptions.git.subcommands.grep,
    },
    {
        name: "gui",
        detail: descriptions.git.subcommands.gui,
    },
    {
        name: "init",
        detail: descriptions.git.subcommands.init,
    },
    {
        name: "log",
        detail: descriptions.git.subcommands.log,
    },
    {
        name: "merge",
        detail: descriptions.git.subcommands.merge,
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
        detail: descriptions.git.subcommands.mv,
    },
    {
        name: "notes",
        detail: descriptions.git.subcommands.notes,
    },
    {
        name: "pull",
        detail: descriptions.git.subcommands.pull,
        provider: combine([
            longFlag("rebase"),
            longFlag("no-rebase"),
            staticSuggestionsProvider(commonMergeOptions),
            staticSuggestionsProvider(fetchOptions),
        ]),
    },
    {
        name: "push",
        detail: descriptions.git.subcommands.push,
        provider: staticSuggestionsProvider(pushOptions),
    },
    {
        name: "rebase",
        detail: descriptions.git.subcommands.rebase,
    },
    {
        name: "reset",
        detail: descriptions.git.subcommands.reset,
        provider: staticSuggestionsProvider(resetOptions),
    },
    {
        name: "revert",
        detail: descriptions.git.subcommands.revert,
    },
    {
        name: "rm",
        detail: descriptions.git.subcommands.rm,
    },
    {
        name: "shortlog",
        detail: descriptions.git.subcommands.shortlog,
    },
    {
        name: "show",
        detail: descriptions.git.subcommands.show,
    },
    {
        name: "stash",
        detail: descriptions.git.subcommands.stash,
    },
    {
        name: "status",
        detail: descriptions.git.subcommands.status,
        provider: staticSuggestionsProvider(statusOptions),
    },
    {
        name: "submodule",
        detail: descriptions.git.subcommands.submodule,
    },
    {
        name: "tag",
        detail: descriptions.git.subcommands.tag,
    },
    {
        name: "worktree",
        detail: descriptions.git.subcommands.worktree,
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
