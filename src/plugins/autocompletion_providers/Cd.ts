import PluginManager from "../../PluginManager";
import {Suggestion, fileSuggestions} from "./Suggestions";
import * as _ from "lodash";
import * as Path from "path";
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

        const cdPath = job.environment.get("CDPATH").split(Path.delimiter).map(path => path || job.session.directory);
        const suggestions = await Promise.all(cdPath.map(directory => fileSuggestions(directory, job.prompt.lastArgument)));
        return _.flatten(suggestions).filter(file => file.info.stat.isDirectory());
    },
});
