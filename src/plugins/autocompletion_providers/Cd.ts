import {expandHistoricalDirectory} from "../../shell/BuiltInCommands";
import {styles, directoriesSuggestionsProvider, Suggestion} from "../autocompletion_utils/Common";
import * as _ from "lodash";
import {PluginManager} from "../../PluginManager";

PluginManager.registerAutocompletionProvider("cd", async(context) => {
    let suggestions: Suggestion[] = [];

    /**
     * Historical directories.
     */
    if (context.argument.value.startsWith("-")) {
        const historicalDirectoryAliases = ["-", "-2", "-3", "-4", "-5", "-6", "-7", "-8", "-9"]
            .slice(0, context.historicalPresentDirectoriesStack.size)
            .map(alias => ({
                label: alias,
                description: expandHistoricalDirectory(alias, context.historicalPresentDirectoriesStack),
                style: styles.directory,
            }));

        suggestions.push(...historicalDirectoryAliases);
    }

    if (context.argument.value.length > 0) {
        const cdpathDirectories = _.flatten(await Promise.all(context.environment.cdpath
            .map(async(directory) => (await directoriesSuggestionsProvider(context, directory)).map(suggestion => ({...suggestion, description: `In ${directory}`})))));

        suggestions.push(...cdpathDirectories);
    }

    return suggestions;
});
