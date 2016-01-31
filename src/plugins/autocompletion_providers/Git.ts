import Utils from "../../Utils";
import Job from "../../Job";
import * as _ from "lodash";
import * as e from "../../Enums";
import * as Path from "path";
import PluginManager from "../../PluginManager";
import {linedOutputOf} from "../../PTY";
import {
    Suggestion, Subcommand, Option, OptionWithValue,
    LongOption,
} from "./Suggestions";

class File extends Suggestion {
    constructor(protected _line: string) {
        super();
    }

    get value(): string {
        return this._line.substring(3).trim();
    }

    get type(): string {
        return "file";
    }

    get iconColor(): e.Color {
        return this.colorsMap[this.workingTreeStatusCode];
    }

    get isAbleToAdd(): boolean {
        return this.workingTreeStatusCode !== " ";
    }

    get workingTreeStatusCode(): string {
        return this._line[1];
    }

    private get colorsMap(): Dictionary<e.Color> {
        return {
            "?": e.Color.Green,
            "M": e.Color.Blue,
            "D": e.Color.Red,
        };
    };
}

class Branch extends Suggestion {
    constructor(protected _line: string) {
        super();
    }

    get value(): string {
        return this._line.trim();
    }

    get type(): string {
        return "branch";
    }

    get isCurrent(): boolean {
        return this._line[0] === "*";
    }
}

const addOptions = [
    new Option("dry-run").withAlias("n").withDescription("Don't actually add the file(s), just show if they exist and/or will be ignored."),
    new Option("verbose").withSynopsis("Be verbose"),
    new Option("interactive").withDescription(`
        Add modified contents in the working tree interactively to the index. Optional path arguments may be supplied to limit operation to a subset
        of the working tree. See "Interactive mode" for details.`),
    new Option("patch").withDescription(
        `Interactively choose hunks of patch between the index and the work tree and add them to the index. This gives the user a chance to review the
         difference before adding modified contents to the index.
         This effectively runs add --interactive, but bypasses the initial command menu and directly jumps to the patch subcommand. See "Interactive
         mode" for details.`),
    new Option("edit").withDescription(`
        Open the diff vs. the index in an editor and let the user edit it. After the editor was closed, adjust the hunk headers and apply the patch to the index.

        The intent of this option is to pick and choose lines of the patch to apply, or even to modify the contents of lines to be staged. This can be
        quicker and more flexible than using the interactive hunk selector. However, it is easy to confuse oneself and create a patch that does not
        apply to the index. See EDITING PATCHES below.`),
    new Option("edit").withDescription(`
        Update the index just where it already has an entry matching <pathspec>. This removes as well as modifies index entries to match the working
        tree, but adds no new files.

        If no <pathspec> is given when -u option is used, all tracked files in the entire working tree are updated (old versions of Git used to limit
        the update to the current directory and its subdirectories).`),
    new Option("all").withAlias("A").withDescription(`
        Update the index not only where the working tree has a file matching <pathspec> but also where the index already has an entry. This adds,
        modifies, and removes index entries to match the working tree.

        If no <pathspec> is given when -A option is used, all files in the entire working tree are updated (old versions of Git used to limit the
        update to the current directory and its subdirectories).`),
    new LongOption("no-all").withDescription(`
        Update the index by adding new files that are unknown to the index and files modified in the working tree, but ignore files that have been
        removed from the working tree. This option is a no-op when no <pathspec> is used.

        This option is primarily to help users who are used to older versions of Git, whose "git add <pathspec>..." was a synonym for "git add
        --no-all <pathspec>...", i.e. ignored removed files.`),
    new Option("intent-to-add").withAlias("N").withDescription(`
        Record only the fact that the path will be added later. An entry for the path is placed in the index with no content. This is useful for,
        among other things, showing the unstaged content of such files with git diff and committing them with git commit -a.`),
    new LongOption("refresh").withDescription("Don't add the file(s), but only refresh their stat() information in the index."),
    new LongOption("ignore-errors").withDescription(`
        If some files could not be added because of errors indexing them, do not abort the operation, but continue adding the others. The command
        shall still exit with non-zero status. The configuration variable add.ignoreErrors can be set to true to make this the default behaviour.`),
    new LongOption("ignore-missing").withDescription(`
        This option can only be used together with --dry-run. By using this option the user can check if any of the given files would be ignored, no
        matter if they are already present in the work tree or not.`),
    ];

async function gitSuggestions(job: Job): Promise<Suggestion[]> {
    const prompt = job.prompt;

    const gitDirectoryPath = Path.join(job.directory, ".git");
    if (!(await Utils.exists(gitDirectoryPath))) {
        return [];
    }

    const subcommand = prompt.arguments[0];
    const args = _.drop(prompt.arguments, 1);

    if (subcommand === "add" && args.length > 0) {
        const changes = await linedOutputOf("git", ["status", "--porcelain"], job.directory);
        const files = <Suggestion[]>changes.map(line => new File(line)).filter(file => file.isAbleToAdd);
        return files.concat(addOptions);
    }

    if ((subcommand === "checkout" || subcommand === "merge") && args.length === 1) {
        let output = await linedOutputOf("git", ["branch", "--no-color"], job.directory);
        let branches: Suggestion[] = output.map(branch => new Branch(branch)).filter(branch => !branch.isCurrent);

        const argument = job.prompt.lastArgument;
        if (doesLookLikeBranchAlias(argument)) {
            let nameOfAlias = (await linedOutputOf("git", ["name-rev", "--name-only", canonizeBranchAlias(argument)], job.directory))[0];
            if (nameOfAlias && !nameOfAlias.startsWith("Could not get")) {
                branches.push(new Suggestion().withValue(argument).withSynopsis(nameOfAlias).withType("branch"));
            }
        }

        return branches;
    }

    return [];
}

const porcelainCommands = [
    new Subcommand("add").withSynopsis("Add file contents to the index."),
    new Subcommand("am").withSynopsis("Apply a series of patches from a mailbox."),
    new Subcommand("archive").withSynopsis("Create an archive of files from a named tree."),
    new Subcommand("bisect").withSynopsis("Find by binary search the change that introduced a bug."),
    new Subcommand("branch").withSynopsis("List, create, or delete branches."),
    new Subcommand("bundle").withSynopsis("Move objects and refs by archive."),
    new Subcommand("checkout").withSynopsis("Switch branches or restore working tree files."),
    new Subcommand("cherry-pick").withSynopsis("Apply the changes introduced by some existing commits."),
    new Subcommand("citool").withSynopsis("Graphical alternative to git-commit."),
    new Subcommand("clean").withSynopsis("Remove untracked files from the working tree."),
    new Subcommand("clone").withSynopsis("Clone a repository into a new directory."),
    new Subcommand("commit").withSynopsis("Record changes to the repository."),
    new Subcommand("describe").withSynopsis("Describe a commit using the most recent tag reachable from it."),
    new Subcommand("diff").withSynopsis("Show changes between commits, commit and working tree, etc."),
    new Subcommand("fetch").withSynopsis("Download objects and refs from another repository."),
    new Subcommand("format-patch").withSynopsis("Prepare patches for e-mail submission."),
    new Subcommand("gc").withSynopsis("Cleanup unnecessary files and optimize the local repository."),
    new Subcommand("grep").withSynopsis("Print lines matching a pattern."),
    new Subcommand("gui").withSynopsis("A portable graphical interface to Git."),
    new Subcommand("init").withSynopsis("Create an empty Git repository or reinitialize an existing one."),
    new Subcommand("log").withSynopsis("Show commit logs."),
    new Subcommand("merge").withSynopsis("Join two or more development histories together."),
    new Subcommand("mv").withSynopsis("Move or rename a file, a directory, or a symlink."),
    new Subcommand("notes").withSynopsis("Add or inspect object notes."),
    new Subcommand("pull").withSynopsis("Fetch from and integrate with another repository or a local branch."),
    new Subcommand("push").withSynopsis("Update remote refs along with associated objects."),
    new Subcommand("rebase").withSynopsis("Forward-port local commits to the updated upstream head."),
    new Subcommand("reset").withSynopsis("Reset current HEAD to the specified state."),
    new Subcommand("revert").withSynopsis("Revert some existing commits."),
    new Subcommand("rm").withSynopsis("Remove files from the working tree and from the index."),
    new Subcommand("shortlog").withSynopsis("Summarize git log output."),
    new Subcommand("show").withSynopsis("Show various types of objects."),
    new Subcommand("stash").withSynopsis("Stash the changes in a dirty working directory away."),
    new Subcommand("status").withSynopsis("Show the working tree status."),
    new Subcommand("submodule").withSynopsis("Initialize, update or inspect submodules."),
    new Subcommand("tag").withSynopsis("Create, list, delete or verify a tag object signed with GPG."),
    new Subcommand("worktree").withSynopsis("Manage multiple worktrees."),

];

export class OptionValueSuggestion extends Suggestion {
    constructor(protected _name: string) {
        super();
    }

    get value(): string {
        return this._name;
    }

    getPrefix(job: Job): string {
        const lexeme = job.prompt.lastLexeme;
        return lexeme.substring(lexeme.lastIndexOf("=") + 1);
    }

    get type(): string {
        return "option-value";
    }
}

const cleanupModes = _.map(
    {
        strip: "Strip leading and trailing empty lines, trailing whitespace, commentary and collapse consecutive empty lines.",
        whitespace: "Same as strip except #commentary is not removed.",
        verbatim: "Do not change the message at all.",
        scissors: 'Same as whitespace, except that everything from (and including) the line \
        "#------------------------ >8 ------------------------"\
        is truncated if the message is to be edited. "#" can be customized with core.commentChar.',
        default: "Same as strip if the message is to be edited. Otherwise whitespace",
    },
    (description: string, mode: string) => new OptionValueSuggestion(mode).withDescription(description)
);

const commitOptions = [
    new OptionWithValue("message", "--message=<msg>").
        withSynopsis("-m <msg>").
        withDescription("Use the given <msg> as the commit message. If multiple -m options are given, their values are concatenated as separate paragraphs."),
    new OptionWithValue("cleanup", "--cleanup=<mode>").
        withDescription("This option determines how the supplied commit message should be cleaned up before committing. The <mode> can be strip, whitespace, verbatim, scissors or default.").
        withChildrenProvider(async () => cleanupModes),
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

PluginManager.registerAutocompletionProvider({
    forCommand: `git commit`,
    getSuggestions: async (job: Job) => {
        const currentOption = _.find(commitOptions, option => option.shouldSuggestChildren(job));
        if (currentOption) {
            return await currentOption.getChildren(job);
        }
        return commitOptions;
    },
});

PluginManager.registerAutocompletionProvider({
    forCommand: `git`,
    getSuggestions: async (job) => porcelainCommands,
});

["add", "checkout", "merge"].forEach(subcommand =>
    PluginManager.registerAutocompletionProvider({
        forCommand: `git ${subcommand}`,
        getSuggestions: gitSuggestions,
    })
);
