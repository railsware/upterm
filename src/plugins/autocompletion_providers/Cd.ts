// import PluginManager from "PluginManager";
import {type} from "./Suggestions";
// import * as _ from "lodash";
// import {expandHistoricalDirectory, isHistoricalDirectory} from "Command";
// import {userFriendlyPath} from "utils/Common";
import {
    executable, runtime, string, sequence, many1, decorateResult, decorate, choice,
    append, noisySuggestions,
} from "../../Parser";
import {isDirectory, statsIn, resolveDirectory} from "../../utils/Common";

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

const directoryAlias = noisySuggestions(choice(["~", "/", "..", "."].map(string)));

const directory = many1(
    decorate(
        decorateResult(
            runtime(async (context) => {
                if (!(await isDirectory(context.directory))) {
                    return [];
                }

                const childDirectory = choice((await statsIn(context.directory)).filter(info => info.stat.isDirectory()).map(info => info.name).map(name => name.startsWith(".") ? noisySuggestions(string(name)) : string(name)));
                return append("/", choice([directoryAlias, childDirectory]));
            }),
            result => Object.assign({}, result, {context: Object.assign({}, result.context, {directory: resolveDirectory(result.context.directory, result.parse)})})
        ),
        type("directory")
    )
);

export const cd = sequence(executable("cd"), directory);
