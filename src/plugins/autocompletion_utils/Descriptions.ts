/* tslint:disable:max-line-length */

export const descriptions = {
    git: {
        add: {
            patch: 'Interactively choose hunks of patch between the index and the work tree and add them to the index. This gives the user a chance to review the difference before adding modified contents to the index. This effectively runs add --interactive, but bypasses the initial command menu and directly jumps to the patch subcommand. See "Interactive mode" for details.',
            interactive: 'Add modified contents in the working tree interactively to the index. Optional path arguments may be supplied to limit operation to a subset of the working tree. See "Interactive mode" for details.',
        },
        commit: {
            message: "Use the given <msg> as the commit message. If multiple -m options are given, their values are concatenated as separate paragraphs.",
            all: "Tell the command to automatically stage files that have been modified and deleted, but new files you have not told Git about are not affected.",
            patch: "Use the interactive patch selection interface to chose which changes to commit. See git-add(1) for details.",
            NULL: "When showing short or porcelain status output, terminate entries in the status output with NULL, instead of LF. If no format is given, implies the --porcelain output format.",
            template: "When editing the commit message, start the editor with the contents in the given file. The commit.template configuration variable is often used to give this option implicitly to the command. This mechanism can be used by projects that want to guide participants with some hints on what to write in the message in what order. If the user exits the editor without editing the message, the commit is aborted. This has no effect when a message is given by other means, e.g. with the -m or -F options.",
            signoff: "Add Signed-off-by line by the committer at the end of the commit log message. The meaning of a signoff depends on the project, but it typically certifies that committer has the rights to submit this work under the same license and agrees to a Developer Certificate of Origin (see http://developercertificate.org/ for more information).",
            noVerify: "This option bypasses the pre-commit and commit-msg hooks. See also githooks(5).",
            edit: "The message taken from file with -F, command line with -m, and from commit object with -C are usually used as the commit log message unmodified. This option lets you further edit the message taken from these sources.",
            include: "Before making a commit out of staged contents so far, stage the contents of paths given on the command line as well. This is usually not what you want unless you are concluding a conflicted merge.",
            only: "Make a commit by taking the updated working tree contents of the paths specified on the command line, disregarding any contents that have been staged for other paths. This is the default mode of operation of git commit if any paths are given on the command line, in which case this option can be omitted. If this option is specified together with --amend, then no paths need to be specified, which can be used to amend the last commit without committing changes that have already been staged.",
            verbose: "Show unified diff between the HEAD commit and what would be committed at the bottom of the commit message template to help the user describe the commit by reminding what changes the commit has. Note that this diff output doesn't have its lines prefixed with #. This diff will not be a part of the commit message. See the commit.verbose configuration variable in git-config(1). If specified twice, show in addition the unified diff between what would be committed and the worktree files, i.e. the unstaged changes to tracked files.",
            quiet: "Suppress commit summary message.",
            resetAuthor: "When used with -C/-c/--amend options, or when committing after a a conflicting cherry-pick, declare that the authorship of the resulting commit now belongs to the committer. This also renews the author timestamp.",
            short: "When doing a dry-run, give the output in the short-format. See git-status(1) for details. Implies --dry-run.",
            branch: "Show the branch and tracking info even in short-format.",
            porcelain: "When doing a dry-run, give the output in a porcelain-ready format. See git-status(1) for details. Implies --dry-run.",
            long: "When doing a dry-run, give the output in a the long-format. Implies --dry-run.",
            allowEmpty: "Usually recording a commit that has the exact same tree as its sole parent commit is a mistake, and the command prevents you from making such a commit. This option bypasses the safety, and is primarily for use by foreign SCM interface scripts.",
            allowEmptyMessage: "Like --allow-empty this command is primarily for use by foreign SCM interface scripts. It allows you to create a commit with an empty commit message without using plumbing commands like git-commit-tree(1).",
            noEdit: "Use the selected commit message without launching an editor. For example, git commit --amend --no-edit amends a commit without changing its commit message.",
            noPostRewrite: "Bypass the post-rewrite hook.",
            dryRun: "Do not create a commit, but show a list of paths that are to be committed, paths with local changes that will be left uncommitted and paths that are untracked.",
            status: "Include the output of git-status(1) in the commit message template when using an editor to prepare the commit message. Defaults to on, but can be used to override configuration variable commit.status.",
            noStatus: "Do not include the output of git-status(1) in the commit message template when using an editor to prepare the default commit message.",
            noGpgSign: "Countermand commit.gpgSign configuration variable that is set to force each and every commit to be signed.",
        },
    },
};
