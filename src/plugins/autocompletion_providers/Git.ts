import * as Git from "../../utils/Git";
import {
    executable, runtime, choice, string, option, decorate, sequence, optional,
    spacesWithoutSuggestion, commandSwitch, token,
} from "../../Parser";
import {description, type, command} from "./Suggestions";
import {compose} from "../../utils/Common";

// class File extends Suggestion {
//     constructor(protected _line: string) {
//         super();
//     }
//
//     get value(): string {
//         return this._line.substring(3).trim();
//     }
//
//     get type(): string {
//         return "file";
//     }
//
//     get iconColor(): e.Color {
//         return this.colorsMap[this.workingTreeStatusCode];
//     }
//
//     get isAbleToAdd(): boolean {
//         return this.workingTreeStatusCode !== " ";
//     }
//
//     get workingTreeStatusCode(): string {
//         return this._line[1];
//     }
//
//     private get colorsMap(): Dictionary<e.Color> {
//         return {
//             "?": e.Color.Green,
//             "M": e.Color.Blue,
//             "D": e.Color.Red,
//         };
//     };
// }

// const addOptions = [
//     new Option("dry-run").withAlias("n").withDescription("Don't actually add the file(s), just show if they exist and/or will be ignored."),
//     new Option("verbose").withSynopsis("Be verbose"),
//     new Option("interactive").withDescription(`
//         Add modified contents in the working tree interactively to the index. Optional path arguments may be supplied to limit operation to a subset
//         of the working tree. See "Interactive mode" for details.`),
//     new Option("patch").withDescription(
//         `Interactively choose hunks of patch between the index and the work tree and add them to the index. This gives the user a chance to review the
//          difference before adding modified contents to the index.
//          This effectively runs add --interactive, but bypasses the initial command menu and directly jumps to the patch subcommand. See "Interactive
//          mode" for details.`),
//     new Option("edit").withDescription(`
//         Open the diff vs. the index in an editor and let the user edit it. After the editor was closed, adjust the hunk headers and apply the patch to the index.
//
//         The intent of this option is to pick and choose lines of the patch to apply, or even to modify the contents of lines to be staged. This can be
//         quicker and more flexible than using the interactive hunk selector. However, it is easy to confuse oneself and create a patch that does not
//         apply to the index. See EDITING PATCHES below.`),
//     new Option("edit").withDescription(`
//         Update the index just where it already has an entry matching <pathspec>. This removes as well as modifies index entries to match the working
//         tree, but adds no new files.
//
//         If no <pathspec> is given when -u option is used, all tracked files in the entire working tree are updated (old versions of Git used to limit
//         the update to the current directory and its subdirectories).`),
//     new Option("all").withAlias("A").withDescription(`
//         Update the index not only where the working tree has a file matching <pathspec> but also where the index already has an entry. This adds,
//         modifies, and removes index entries to match the working tree.
//
//         If no <pathspec> is given when -A option is used, all files in the entire working tree are updated (old versions of Git used to limit the
//         update to the current directory and its subdirectories).`),
//     new LongOption("no-all").withDescription(`
//         Update the index by adding new files that are unknown to the index and files modified in the working tree, but ignore files that have been
//         removed from the working tree. This option is a no-op when no <pathspec> is used.
//
//         This option is primarily to help users who are used to older versions of Git, whose "git add <pathspec>..." was a synonym for "git add
//         --no-all <pathspec>...", i.e. ignored removed files.`),
//     new Option("intent-to-add").withAlias("N").withDescription(`
//         Record only the fact that the path will be added later. An entry for the path is placed in the index with no content. This is useful for,
//         among other things, showing the unstaged content of such files with git diff and committing them with git commit -a.`),
//     new LongOption("refresh").withDescription("Don't add the file(s), but only refresh their stat() information in the index."),
//     new LongOption("ignore-errors").withDescription(`
//         If some files could not be added because of errors indexing them, do not abort the operation, but continue adding the others. The command
//         shall still exit with non-zero status. The configuration variable add.ignoreErrors can be set to true to make this the default behaviour.`),
//     new LongOption("ignore-missing").withDescription(`
//         This option can only be used together with --dry-run. By using this option the user can check if any of the given files would be ignored, no
//         matter if they are already present in the work tree or not.`),
// ];

// async function gitSuggestions(job: Job): Promise<Suggestion[]> {
//     const prompt = job.prompt;
//
//     const gitDirectoryPath = Path.join(job.session.directory, ".git");
//     if (!(await exists(gitDirectoryPath))) {
//         return [];
//     }
//
//     const subcommand = prompt.arguments[0];
//     const args = _.drop(prompt.arguments, 1);
//
//     if (subcommand === "add" && args.length > 0) {
//         const changes = await linedOutputOf("git", ["status", "--porcelain"], job.session.directory);
//         const files = <Suggestion[]>changes.map(line => new File(line)).filter(file => file.isAbleToAdd);
//         return files.concat(addOptions);
//     }
//
//     if ((subcommand === "checkout" || subcommand === "merge") && args.length === 1) {
//         let branches: Suggestion[] = (await Git.branches(job.session.directory)).filter(branch => !branch.isCurrent()).map(branch => new Suggestion().withValue(branch.toString()).withType("branch"));
//
//         const argument = job.prompt.lastArgument;
//         if (doesLookLikeBranchAlias(argument)) {
//             let nameOfAlias = (await linedOutputOf("git", ["name-rev", "--name-only", canonizeBranchAlias(argument)], job.session.directory))[0];
//             if (nameOfAlias && !nameOfAlias.startsWith("Could not get")) {
//                 branches.push(new Suggestion().withValue(argument).withSynopsis(nameOfAlias).withType("branch"));
//             }
//         }
//
//         return branches;
//     }
//
//     return [];
// }
//
// function doesLookLikeBranchAlias(word: string) {
//     if (!word) return false;
//     return word.startsWith("-") || word.includes("@") || word.includes("HEAD") || /\d/.test(word);
// }
//
// function canonizeBranchAlias(alias: string) {
//     if (alias[0] === "-") {
//         const steps = parseInt(alias.slice(1), 10) || 1;
//         alias = `@{-${steps}}`;
//     }
//
//     return alias;
// }

const cleanupMode = decorate(
    choice([
        decorate(string("strip"), description("Strip leading and trailing empty lines, trailing whitespace, commentary and collapse consecutive empty lines.")),
        decorate(string("whitespace"), description("Same as strip except #commentary is not removed.")),
        decorate(string("verbatim"), description("Do not change the message at all.")),
        decorate(string("scissors"), description('Same as whitespace, except that everything from (and including) the line \
        "#------------------------ >8 ------------------------"\
        is truncated if the message is to be edited. "#" can be customized with core.commentChar.')),
        decorate(string("default"), description("Same as strip if the message is to be edited. Otherwise whitespace")),
    ]),
    type("option-value")
);

const commitOption = choice([
    decorate(option("message"), description("Use the given <msg> as the commit message. If multiple -m options are given, their values are concatenated as separate paragraphs.")),
    sequence(
        decorate(
            option("cleanup"),
            description("This option determines how the supplied commit message should be cleaned up before committing. The <mode> can be strip, whitespace, verbatim, scissors or default.")
        ),
        cleanupMode
    ),
]);

const pushOption = choice([commandSwitch("force-with-lease")]);
const statusOption = choice([commandSwitch("short")]);

const branchesExceptCurrent = decorate(
    runtime(async(context) => {
        const branches = (await Git.branches(context.directory)).filter(branch => !branch.isCurrent());
        return choice(branches.map(branch => string(branch.toString())));
    }),
    type("branch")
);

const gitCommand = choice([
    decorate(string("add"), compose(command, description("Add file contents to the index."))),
    decorate(string("am"), compose(command, description("Apply a series of patches from a mailbox."))),
    decorate(string("archive"), compose(command, description("Create an archive of files from a named tree."))),
    decorate(string("bisect"), compose(command, description("Find by binary search the change that introduced a bug."))),
    decorate(string("branch"), compose(command, description("List, create, or delete branches."))),
    decorate(string("bundle"), compose(command, description("Move objects and refs by archive."))),
    sequence(decorate(token(string("checkout")), compose(command, description("Switch branches or restore working tree files."))), branchesExceptCurrent),
    decorate(string("cherry-pick"), compose(command, description("Apply the changes introduced by some existing commits."))),
    decorate(string("citool"), compose(command, description("Graphical alternative to git-commit."))),
    decorate(string("clean"), compose(command, description("Remove untracked files from the working tree."))),
    decorate(string("clone"), compose(command, description("Clone a repository into a new directory."))),
    sequence(decorate(token(string("commit")), compose(command, description("Record changes to the repository."))), commitOption),
    decorate(string("describe"), compose(command, description("Describe a commit using the most recent tag reachable from it."))),
    decorate(string("diff"), compose(command, description("Show changes between commits, commit and working tree, etc."))),
    decorate(string("fetch"), compose(command, description("Download objects and refs from another repository."))),
    decorate(string("format-patch"), compose(command, description("Prepare patches for e-mail submission."))),
    decorate(string("gc"), compose(command, description("Cleanup unnecessary files and optimize the local repository."))),
    decorate(string("grep"), compose(command, description("Print lines matching a pattern."))),
    decorate(string("gui"), compose(command, description("A portable graphical interface to Git."))),
    decorate(string("init"), compose(command, description("Create an empty Git repository or reinitialize an existing one."))),
    decorate(string("log"), compose(command, description("Show commit logs."))),
    sequence(decorate(token(string("merge")), compose(command, description("Join two or more development histories together."))), branchesExceptCurrent),
    decorate(string("mv"), compose(command, description("Move or rename a file, a directory, or a symlink."))),
    decorate(string("notes"), compose(command, description("Add or inspect object notes."))),
    decorate(string("pull"), compose(command, description("Fetch from and integrate with another repository or a local branch."))),
    sequence(decorate(string("push"), compose(command, description("Update remote refs along with associated objects."))), optional(sequence(spacesWithoutSuggestion, pushOption))),
    decorate(string("rebase"), compose(command, description("Forward-port local commits to the updated upstream head."))),
    decorate(string("reset"), compose(command, description("Reset current HEAD to the specified state."))),
    decorate(string("revert"), compose(command, description("Revert some existing commits."))),
    decorate(string("rm"), compose(command, description("Remove files from the working tree and from the index."))),
    decorate(string("shortlog"), compose(command, description("Summarize git log output."))),
    decorate(string("show"), compose(command, description("Show various types of objects."))),
    decorate(string("stash"), compose(command, description("Stash the changes in a dirty working directory away."))),
    sequence(decorate(string("status"), compose(command, description("Show the working tree status."))), optional(sequence(spacesWithoutSuggestion, statusOption))),
    decorate(string("submodule"), compose(command, description("Initialize, update or inspect submodules."))),
    decorate(string("tag"), compose(command, description("Create, list, delete or verify a tag object signed with GPG."))),
    decorate(string("worktree"), compose(command, description("Manage multiple worktrees."))),
]);

export const git = sequence(executable("git"), gitCommand);
