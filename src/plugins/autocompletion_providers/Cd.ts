import PluginManager from "../../PluginManager";
import {fileSuggestions} from "./Suggestions";

PluginManager.registerAutocompletionProvider({
    forCommand: "cd",
    getSuggestions: async  (job) => {
        if (job.prompt.expanded.length !== 2) {
            return [];
        }

        const suggestions = await fileSuggestions(job);
        return suggestions.filter(file => file.info.stat.isDirectory());
    },
});
