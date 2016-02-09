import PluginManager from "../../PluginManager";
import {fileSuggestions, Suggestion} from "./Suggestions";
import * as _ from "lodash";
import {expandHistoricalDirectory, isHistoricalDirectory} from "../../Command";

PluginManager.registerAutocompletionProvider({
    forCommand: "cd",
    getSuggestions: async(job) => {
        if (job.prompt.expanded.length !== 2) {
            return [];
        }

        const argument = job.prompt.lastArgument;

        if (isHistoricalDirectory(argument)) {
            let suggestions: Suggestion[] = [];
            try {
                const expanded = expandHistoricalDirectory(argument, job);
                suggestions.push(new Suggestion().withValue(argument).withSynopsis(expanded).withType("file directory"));
            } catch (error) {
                return new Suggestion().withValue(argument).withSynopsis(error.message).withType("error");
            }

            if (argument === "-") {
                suggestions = suggestions.concat(_.range(2, job.session.historicalCurrentDirectoriesStack.length).map(index => {
                    const position = `-${index}`;
                    return new Suggestion().withValue(position).withSynopsis(expandHistoricalDirectory(position, job)).withType("file directory");
                }));
            }

            return suggestions;
        }

        const suggestions = await fileSuggestions(job);
        return suggestions.filter(file => file.info.stat.isDirectory());
    },
});
