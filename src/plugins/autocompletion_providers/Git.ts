import * as Git from "../../utils/Git";
import {styles, Suggestion, longAndShortFlag, longFlag} from "./Suggestions";
import {PluginManager} from "../../PluginManager";
import {AutocompletionProvider, AutocompletionContext} from "../../Interfaces";
import {combineAutocompletionProviders} from "./Common";
import {linedOutputOf} from "../../PTY";

const addOptions = [
    longAndShortFlag("patch").withDescription(
        `Interactively choose hunks of patch between the index and the work tree and add them to the index. This gives the user a chance to review the
         difference before adding modified contents to the index.
         This effectively runs add --interactive, but bypasses the initial command menu and directly jumps to the patch subcommand. See "Interactive
         mode" for details.`),
    longFlag("interactive").withDescription(`
        Add modified contents in the working tree interactively to the index. Optional path arguments may be supplied to limit operation to a subset
        of the working tree. See "Interactive mode" for details.`),
    longFlag("edit").withDescription(`
    longAndShortOption("dry-run", "n").withDescription("Don't actually add the file(s), just show if they exist and/or will be ignored."),
    longOption("verbose").withSynopsis("Be verbose"),
        Open the diff vs. the index in an editor and let the user edit it. After the editor was closed, adjust the hunk headers and apply the patch to the index.

        The intent of this option is to pick and choose lines of the patch to apply, or even to modify the contents of lines to be staged. This can be
        quicker and more flexible than using the interactive hunk selector. However, it is easy to confuse oneself and create a patch that does not
        apply to the index. See EDITING PATCHES below.`),
    longFlag("edit").withDescription(`
        Update the index just where it already has an entry matching <pathspec>. This removes as well as modifies index entries to match the working
        tree, but adds no new files.

        If no <pathspec> is given when -u option is used, all tracked files in the entire working tree are updated (old versions of Git used to limit
        the update to the current directory and its subdirectories).`),
    longAndShortFlag("all", "A").withDescription(`
        Update the index not only where the working tree has a file matching <pathspec> but also where the index already has an entry. This adds,
        modifies, and removes index entries to match the working tree.

        If no <pathspec> is given when -A option is used, all files in the entire working tree are updated (old versions of Git used to limit the
        update to the current directory and its subdirectories).`),
    longFlag("no-all").withDescription(`
        Update the index by adding new files that are unknown to the index and files modified in the working tree, but ignore files that have been
        removed from the working tree. This option is a no-op when no <pathspec> is used.

        This option is primarily to help users who are used to older versions of Git, whose "git add <pathspec>..." was a synonym for "git add
        --no-all <pathspec>...", i.e. ignored removed files.`),
    longAndShortFlag("intent-to-add", "N").withDescription(`
        Record only the fact that the path will be added later. An entry for the path is placed in the index with no content. This is useful for,
        among other things, showing the unstaged content of such files with git diff and committing them with git commit -a.`),
    longFlag("refresh").withDescription("Don't add the file(s), but only refresh their stat() information in the index."),
    longFlag("ignore-errors").withDescription(`
        If some files could not be added because of errors indexing them, do not abort the operation, but continue adding the others. The command
        shall still exit with non-zero status. The configuration variable add.ignoreErrors can be set to true to make this the default behaviour.`),
    longFlag("ignore-missing").withDescription(`
        This option can only be used together with --dry-run. By using this option the user can check if any of the given files would be ignored, no
        matter if they are already present in the work tree or not.`),
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

const commitOptions = [
    longAndShortFlag("message").withDescription("Use the given <msg> as the commit message. If multiple -m options are given, their values are concatenated as separate paragraphs."),
];

const pushOptions = [
    longFlag("force-with-lease"),
];

const statusOptions = [
    longFlag("short"),
];

const branchesExceptCurrent = async(context: AutocompletionContext): Promise<Suggestion[]> => {
    if (Git.isGitDirectory(context.environment.pwd)) {
        const branches = (await Git.branches(context.environment.pwd)).filter(branch => !branch.isCurrent());
        return branches.map(branch => new Suggestion().withValue(branch.toString()).withStyle(styles.branch));
    } else {
        return [];
    }
};

const branchAlias = async(context: AutocompletionContext): Promise<Suggestion[]> => {
    if (doesLookLikeBranchAlias(context.argument.value)) {
        let nameOfAlias = (await linedOutputOf("git", ["name-rev", "--name-only", canonizeBranchAlias(context.argument.value)], context.environment.pwd))[0];
        if (nameOfAlias && !nameOfAlias.startsWith("Could not get")) {
            return [new Suggestion().withValue(context.argument.value).withSynopsis(nameOfAlias).withStyle(styles.branch)];
        }
    }

    return [];
};

const notStagedFiles = async(context: AutocompletionContext): Promise<Suggestion[]> => {
    if (Git.isGitDirectory(context.environment.pwd)) {
        const fileStatuses = await Git.status(context.environment.pwd);
        return fileStatuses
            .filter(fileStatus => !context.argument.command.hasArgument(fileStatus.value))
            .map(fileStatus => new Suggestion().withValue(fileStatus.value).withStyle(styles.gitFileStatus(fileStatus.code)).withSpace());
    } else {
        return [];
    }
};

const subCommandProviders: Dictionary<AutocompletionProvider> = {
    add: combineAutocompletionProviders([notStagedFiles, addOptions]),
    checkout: combineAutocompletionProviders([branchesExceptCurrent, branchAlias]),
    commit: commitOptions,
    status: statusOptions,
    merge: combineAutocompletionProviders([branchesExceptCurrent, branchAlias]),
    push: pushOptions,
};

const subCommands = [
    {
        name: "add",
        description: "Add file contents to the index.",
    },
    {
        name: "am",
        description: "Apply a series of patches from a mailbox.",
    },
    {
        name: "archive",
        description: "Create an archive of files from a named tree.",
    },
    {
        name: "bisect",
        description: "Find by binary search the change that introduced a bug.",
    },
    {
        name: "branch",
        description: "List, create, or delete branches.",
    },
    {
        name: "bundle",
        description: "Move objects and refs by archive.",
    },
    {
        name: "checkout",
        description: "Switch branches or restore working tree files.",
    },
    {
        name: "cherry-pick",
        description: "Apply the changes introduced by some existing commits.",
    },
    {
        name: "citool",
        description: "Graphical alternative to git-commit.",
    },
    {
        name: "clean",
        description: "Remove untracked files from the working tree.",
    },
    {
        name: "clone",
        description: "Clone a repository into a new directory.",
    },
    {
        name: "commit",
        description: "Record changes to the repository.",
    },
    {
        name: "describe",
        description: "Describe a commit using the most recent tag reachable from it.",
    },
    {
        name: "diff",
        description: "Show changes between commits, commit and working tree, etc.",
    },
    {
        name: "fetch",
        description: "Download objects and refs from another repository.",
    },
    {
        name: "format-patch",
        description: "Prepare patches for e-mail submission.",
    },
    {
        name: "gc",
        description: "Cleanup unnecessary files and optimize the local repository.",
    },
    {
        name: "grep",
        description: "Print lines matching a pattern.",
    },
    {
        name: "gui",
        description: "A portable graphical interface to Git.",
    },
    {
        name: "init",
        description: "Create an empty Git repository or reinitialize an existing one.",
    },
    {
        name: "log",
        description: "Show commit logs.",
    },
    {
        name: "merge",
        description: "Join two or more development histories together.",
    },
    {
        name: "mv",
        description: "Move or rename a file, a directory, or a symlink.",
    },
    {
        name: "notes",
        description: "Add or inspect object notes.",
    },
    {
        name: "pull",
        description: "Fetch from and integrate with another repository or a local branch.",
    },
    {
        name: "push",
        description: "Update remote refs along with associated objects.",
    },
    {
        name: "rebase",
        description: "Forward-port local commits to the updated upstream head.",
    },
    {
        name: "reset",
        description: "Reset current HEAD to the specified state.",
    },
    {
        name: "revert",
        description: "Revert some existing commits.",
    },
    {
        name: "rm",
        description: "Remove files from the working tree and from the index.",
    },
    {
        name: "shortlog",
        description: "Summarize git log output.",
    },
    {
        name: "show",
        description: "Show various types of objects.",
    },
    {
        name: "stash",
        description: "Stash the changes in a dirty working directory away.",
    },
    {
        name: "status",
        description: "Show the working tree status.",
    },
    {
        name: "submodule",
        description: "Initialize, update or inspect submodules.",
    },
    {
        name: "tag",
        description: "Create, list, delete or verify a tag object signed with GPG.",
    },
    {
        name: "worktree",
        description: "Manage multiple worktrees.",
    },
].map(subCommand => new Suggestion().withValue(subCommand.name).withDescription(subCommand.description).withStyle(styles.command).withSpace());

PluginManager.registerAutocompletionProvider("git", async(context) => {
    if (context.argument.position === 1) {
        return subCommands;
    } else {
        const subCommandProvider = subCommandProviders[context.argument.command.nthArgument(1).value];
        if (subCommandProvider) {
            if (Array.isArray(subCommandProvider)) {
                return subCommandProvider;
            } else {
                return subCommandProvider(Object.assign({argument: this}, context));
            }
        } else {
            return [];
        }
    }
});
