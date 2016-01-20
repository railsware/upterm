import * as _ from "lodash";
import * as i from "../../Interfaces";
import PluginManager from "../../PluginManager";
const score: (i: string, m: string) => number = require("fuzzaldrin").score;

const subcommands: _.Dictionary<string> = {
    start: "Start a zeus server in the current directory using zeus.json",
    init: " Generate a template zeus.json",
    rake: "Ruby Make",
    runner: "Run a piece of code in the application environment",
    console: "Start the Rails console",
    server: "Start the Rails server",
    generate: "Generate new code'g')",
    destroy: 'Undo code generated with "generate"',
    dbconsole: "Start a console for the Rails database",
    rspec: "Run specs",
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
    forCommand: "zeus",
    getSuggestions: async function (job): Promise<i.Suggestion[]> {
        if (job.prompt.expanded.length !== 2) {
            return [];
        }

        const suggestions = _.map(subcommands, (value, key) => toSuggestion(key, job.prompt.lastArgument, value));
        return _._(suggestions).sortBy("score").reverse().value();
    },
});
