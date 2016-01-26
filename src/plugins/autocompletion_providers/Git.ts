import Utils from "../../Utils";
import Job from "../../Job";
import * as _ from "lodash";
import * as i from "../../Interfaces";
import * as e from "../../Enums";
import * as Path from "path";
import PluginManager from "../../PluginManager";
import {linedOutputOf} from "../../PTY";

class File extends i.Suggestion {
    constructor(protected _line: string) {
        super();
    }

    get value(): string {
        return this._line.substring(3).trim();
    }

    get type(): string {
        return "file";
    }

    get color(): e.Color {
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

class Branch extends i.Suggestion {
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

async function gitSuggestions(job: Job): Promise<i.Suggestion[]> {
    const prompt = job.prompt;

    const gitDirectoryPath = Path.join(job.directory, ".git");
    if (!(await Utils.exists(gitDirectoryPath))) {
        return [];
    }

    const subcommand = prompt.arguments[0];
    const args = _.drop(prompt.arguments, 1);

    if (subcommand === "add" && args.length > 0) {
        let changes = await linedOutputOf("git", ["status", "--porcelain"], job.directory);
        return changes.map(line => new File(line)).filter(file => file.isAbleToAdd);
    }

    if (subcommand === "checkout" && args.length === 1) {
        let output = await linedOutputOf("git", ["branch", "--no-color"], job.directory);
        return output.map(branch => new Branch(branch)).filter(branch => !branch.isCurrent);
    }

    return [];
}

["add", "checkout"].forEach(subcommand =>
    PluginManager.registerAutocompletionProvider({
        forCommand: `git ${subcommand}`,
        getSuggestions: gitSuggestions,
    })
);
