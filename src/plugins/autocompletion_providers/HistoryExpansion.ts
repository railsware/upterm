import * as i from "../../Interfaces";
import {Job} from "../../Job";
import {isCompleteHistoryCommand, historyReplacement} from "../../CommandExpander";
import {PluginManager} from "../../PluginManager";
import {Suggestion} from "./Suggestions";

const descriptions: Dictionary<string> = {
    "!!": "The previous command",
    "!^": "The first argument of the previous command",
    "!$": "The last argument of the previous command",
    "!*": "All arguments of the previous command",
};

class Expansion extends Suggestion {
    constructor(protected _command: string) {
        super();
    }

    get value(): string {
        return this._command;
    }

    get synopsis(): string {
        return historyReplacement(this._command).join(" ");
    }

    get description(): string {
        return descriptions[this._command];
    }

    get type(): string {
        return "history-expansion";
    }
}

class HistoryExpansion implements i.AutocompletionProvider {

    async getSuggestions(job: Job): Promise<Suggestion[]> {
        return this.commands(job.prompt.lastLexeme).map(command => new Expansion(command));
    }

    private commands(lexeme: string): string[] {
        if (isCompleteHistoryCommand(lexeme)) {
            return [lexeme];
        } else if (lexeme.length === 1 && lexeme.startsWith("!")) {
            return Object.keys(descriptions);
        } else {
            return [];
        }
    }
}

PluginManager.registerAutocompletionProvider(new HistoryExpansion());
