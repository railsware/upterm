import {executable, sequence, decorate, string, noisySuggestions, runtime, choice} from "../../Parser";
import {fileGenerator} from "./Common";
import {expandHistoricalDirectory} from "../../Command";
import {description, type} from "./Suggestions";
import * as _ from "lodash";

// PluginManager.registerAutocompletionProvider({
//     forCommand: "cd",
//     getSuggestions: async(job) => {
//         if (job.prompt.expanded.length !== 2) {
//             return [];
//         }
//
//         const argument = job.prompt.lastArgument;
//
//         if (isHistoricalDirectory(argument)) {
//             let suggestions: Suggestion[] = [];
//             try {
//                 const expanded = expandHistoricalDirectory(argument, job);
//                 suggestions.push(new Suggestion().withValue(argument).withSynopsis(expanded).withType("file directory"));
//             } catch (error) {
//                 return new Suggestion().withValue(argument).withSynopsis(error.message).withType("error");
//             }
//
//             if (argument === "-") {
//                 suggestions = suggestions.concat(_.range(2, job.session.historicalCurrentDirectoriesStack.length).map(index => {
//                     const position = `-${index}`;
//                     return new Suggestion().withValue(position).withSynopsis(expandHistoricalDirectory(position, job)).withType("file directory");
//                 }));
//             }
//
//             return suggestions;
//         }
//
//         const suggestionPromises = job.environment.cdpath(job.session.directory)
//             .map(async (directory) => {
//                 let suggestions: Suggestion[] = (await fileSuggestions(directory, job.prompt.lastArgument)).filter(suggestion => suggestion.info.stat.isDirectory());
//
//                 if (directory !== job.session.directory) {
//                     suggestions = suggestions.map(suggestion => suggestion.withSynopsis(`In CDPATH ${userFriendlyPath(directory)}`));
//                 }
//
//                 return suggestions;
//             });
//         return _.flatten(await Promise.all(suggestionPromises));
//     },
// });

const historicalDirectory = runtime(async (context) =>
    noisySuggestions(
        decorate(
            choice(
                _.take(["-", "-2", "-3", "-4", "-5", "-6", "-7", "-8", "-9"], context.historicalCurrentDirectoriesStack.length - 1)
                    .map(alias => decorate(string(alias), description(expandHistoricalDirectory(alias, context.historicalCurrentDirectoriesStack))))
            ),
            type("directory")
        )
    )
);

export const cd = sequence(executable("cd"), choice([
    fileGenerator(info => info.stat.isDirectory()),
    historicalDirectory,
]));
