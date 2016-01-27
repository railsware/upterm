import Job from "../../Job";
import PluginManager from "../../PluginManager";
import {Option} from "./Suggestions";

const options = [
    new Option("count", "").withDescription("Only a count of selected lines is written to standard output.")
];

PluginManager.registerAutocompletionProvider({
    forCommand: "grep",
    getSuggestions: async (job: Job) => {
        const prompt = job.prompt;

        if (prompt.arguments.length) {
            return options;
        }

        return [];
    },
});
