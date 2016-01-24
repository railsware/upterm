import Utils from "../../Utils";
import Job from "../../Job";
import * as _ from "lodash";
import * as i from "../../Interfaces";
import * as e from "../../Enums";
import * as Path from "path";
import * as OS from "os";
import PluginManager from "../../PluginManager";
import {executeCommand} from "../../PTY";
const score: (i: string, m: string) => number = require("fuzzaldrin").score;

interface GitStatusFile {
    path: string;
    color: e.Color;
}

const statusesToColors: Dictionary<e.Color> = {
    "?": e.Color.Green,
    "M": e.Color.Blue,
    "D": e.Color.Red,
};

function toFileSuggestion(file: GitStatusFile, lastWord: string): i.Suggestion {
    return {
        value: file.path,
        score: 2 + score(file.path, lastWord),
        synopsis: "",
        description: "",
        type: "file",
        color: file.color,
    };
}

function toBranchSuggestion(branch: string, lastWord: string): i.Suggestion {
    return {
        value: branch,
        score: 2 + score(branch, lastWord),
        synopsis: "",
        description: "",
        type: "branch",
    };
}

function toGitStatusFile(line: string): GitStatusFile {
    return {
        path: line.substring(3).trim(),
        color: statusesToColors[line[1]],
    };
}

async function gitSuggestions(job: Job): Promise<i.Suggestion[]> {
    const prompt = job.prompt;

    const gitDirectoryPath = Path.join(job.directory, ".git");
    if (!(await Utils.exists(gitDirectoryPath))) {
        return [];
    }

    const lastArgument = prompt.lastArgument;
    const subcommand = prompt.arguments[0];
    const args = _.drop(prompt.arguments, 1);

    if (subcommand === "add" && args.length > 0) {
        let changes = await executeCommand("git", ["status", "--porcelain"], job.directory);
        let suggestions = changes
            .split(OS.EOL)
            .filter(path => path.length > 0)
            .map(toGitStatusFile)
            .filter((file: GitStatusFile) => !args.includes(file.path) && !_.isEmpty(file.color))
            .map(file => toFileSuggestion(file, lastArgument));

        if (args[0] === "") {
            suggestions.push({
                value: ".", // FIXME: Calclulate the common prefix of all suggested paths.
                score: _.max(suggestions.map(suggestion => suggestion.score)) + 1,
                synopsis: `${suggestions.length} ${Utils.pluralize("file", suggestions.length)}`,
                description: "",
                type: "file",
            });
        }

        return suggestions;
    }

    if (subcommand === "checkout" && args.length === 1) {
        let output = await executeCommand("git", ["branch", "--no-color"], job.directory);
        return output
            .split(OS.EOL)
            .filter(path => path.length > 0 && path[0] !== "*")
            .map(branch => branch.trim())
            .map(branch => toBranchSuggestion(branch, lastArgument));
    }

    return [];
}

["add", "checkout"].forEach(subcommand =>
    PluginManager.registerAutocompletionProvider({
        forCommand: `git ${subcommand}`,
        getSuggestions: gitSuggestions,
    })
);
