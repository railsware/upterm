import * as _ from "lodash";
import Aliases from "../../Aliases";
import Job from "../../Job";
import PluginManager from "../../PluginManager";
import {Suggestion} from "./Suggestions";

class Alias extends Suggestion {
    constructor(protected _alias: string, protected _expanded: string) {
        super();
    };

    get value() {
        return this._alias;
    }

    get displayValue() {
        return this._alias;
    }

    get description() {
        return `Aliased to “${this._expanded}”.`;
    }

    get synopsis() {
        return this._expanded;
    }

    get type() {
        return "alias";
    }
}

// FIXME: it's mapped inside a function because at the time we read this file there are no aliases. Try to make Aliases.all return a promise.
let aliases: Suggestion[] = [];
function allAliases() {
    if (!aliases.length) {
        aliases = _.map(Aliases.all, (expanded: string, alias: string) => new Alias(alias, expanded));
    }
    return aliases;
}

PluginManager.registerAutocompletionProvider({
    getSuggestions: async function(job: Job) {
        if (job.prompt.lexemes.length > 1) {
            return [];
        }

        return allAliases();
    },
});
