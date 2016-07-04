import {expandHistoricalDirectory} from "../../shell/Command";
import {styles, Suggestion, directoriesSuggestionsProvider} from "./Common";
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
            .map(alias => new Suggestion().withValue(alias).withDescription(expandHistoricalDirectory(alias, context.historicalPresentDirectoriesStack)).withStyle(styles.directory));

        suggestions.push(...historicalDirectoryAliases);
    }

    suggestions.push(...await directoriesSuggestionsProvider(context));

    if (context.argument.value.length > 0) {
        const cdpathDirectories = _.flatten(await Promise.all(context.environment.cdpath
            .filter(directory => directory !== context.environment.pwd)
            .map(async(directory) => (await directoriesSuggestionsProvider(context, directory)).map(suggestion => suggestion.withDescription(`In ${directory}`)))));

        suggestions.push(...cdpathDirectories);
    }

    return suggestions;
});
