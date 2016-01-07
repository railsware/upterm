import * as i from "../../Interfaces";
import * as _ from "lodash";
import Aliases from "../../Aliases";
import ExecutionHistory from "../../History";
import Job from "../../Job";
import Autocompletion from "../../Autocompletion";
import PluginManager from "../../PluginManager";
var score: (i: string, m: string) => number = require("fuzzaldrin").score;

class History implements i.AutocompletionProvider {
    async getSuggestions(job: Job) {
        var lastArgument = job.prompt.lastArgument;

        var all = ExecutionHistory.all.filter(entry => entry.raw.length > 3).map(entry => {
            return {
                value: entry.raw,
                score: 0.1 * score(entry.raw, lastArgument),
                synopsis: '',
                description: '',
                replaceAll: true,
                type: "history"
            };
        });

        return _._(all).sortBy("score").reverse().take(Autocompletion.limit).value();
    }
}

PluginManager.registerAutocompletionProvider(new History());
