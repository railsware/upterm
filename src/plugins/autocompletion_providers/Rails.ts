import * as _ from "lodash";
import * as i from "../../Interfaces";
import PluginManager from "../../PluginManager";
const score: (i: string, m: string) => number = require("fuzzaldrin").score;

const subcommands: _.Dictionary<string> = {
    runner: "Run a piece of code in the application environment",
    console: "Start the Rails console",
    server: "Start the Rails server",
    generate: "Generate new code'g')",
    destroy: 'Undo code generated with "generate"',
    dbconsole: "Start a console for the Rails database",
    "new": "Create a new Rails application",
    "plugin new": "Generates skeleton for developing a Rails plugin",
};


function toSuggestion(value: string, lastWord: string, synopsis = ""): i.Suggestion {
    return {
        value: value,
        score: 2 + score(value, lastWord),
        synopsis: synopsis,
        description: "",
        type: "command",
    };
}

PluginManager.registerAutocompletionProvider({
    forCommand: "rails",
    getSuggestions: async function (job): Promise<i.Suggestion[]> {
        if (job.prompt.expanded.length !== 2) {
            return [];
        }

        const suggestions = _.map(subcommands, (value, key) => toSuggestion(key, job.prompt.lastArgument, value));
        return _._(suggestions).sortBy("score").reverse().value();
    },
});
