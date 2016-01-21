import * as i from "../../Interfaces";
import ExecutionHistory from "../../History";
import Job from "../../Job";
import PluginManager from "../../PluginManager";
const score: (i: string, m: string) => number = require("fuzzaldrin").score;

class History implements i.AutocompletionProvider {
    async getSuggestions(job: Job) {
        const lastArgument = job.prompt.lastArgument;

        return ExecutionHistory.all.filter(entry => entry.raw.length > 3).map(entry => {
            return {
                value: entry.raw,
                score: 0.1 * score(entry.raw, lastArgument),
                synopsis: "",
                description: "",
                replaceEverything: true,
                type: "history",
            };
        });
    }
}

PluginManager.registerAutocompletionProvider(new History());
