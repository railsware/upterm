import Job from "../../Job";
import PluginManager from "../../PluginManager";
import {Option} from "./Suggestions";

const options = [
    new Option("count", "", "Only a count of selected lines is written to standard output.")
];

// FIXME: when we have an alias grep='grep --color', suggestions are shown when you have typed grep without a space.
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
