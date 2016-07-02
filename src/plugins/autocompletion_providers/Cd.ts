import {expandHistoricalDirectory} from "../../shell/Command";
import {styles, Suggestion, directoriesSuggestionsProvider} from "./Common";
import * as _ from "lodash";
import * as Path from "path";
import {PluginManager} from "../../PluginManager";

PluginManager.registerAutocompletionProvider("cd", async(context) => {
    let suggestions: Suggestion[] = [];

    /**
     * Parent folders.
     */
    if (context.argument.value.endsWith("..")) {
        const pwdParts = context.environment.pwd.replace(/\/$/, "").split(Path.sep);

        return _.range(1, pwdParts.length).map(numberOfParts => {
            const value = "../".repeat(numberOfParts);
            const description = pwdParts.slice(0, -numberOfParts).join(Path.sep) || Path.sep;

            return new Suggestion().withValue(value).withDescription(description).withStyle(styles.directory);
        });
    }

    /**
     * Historical directories.
     */
    if (context.argument.value.startsWith("-")) {
        const historicalDirectoryAliases = _.take(["-", "-2", "-3", "-4", "-5", "-6", "-7", "-8", "-9"], context.historicalPresentDirectoriesStack.size)
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
