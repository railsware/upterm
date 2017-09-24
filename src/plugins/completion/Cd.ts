import {directoriesSuggestionsProvider, Suggestion} from "../completion_utils/Common";
import * as _ from "lodash";
import {PluginManager} from "../../PluginManager";
import {join} from "path";
import {userFriendlyPath} from "../../utils/Common";

PluginManager.registerAutocompletionProvider("cd", async(context) => {
    let suggestions: Suggestion[] = await directoriesSuggestionsProvider(context);

    if (context.argument.value.length === 0) {
        const cdpathDirectories = _.flatten(await Promise.all(context.environment.cdpath.filter(path => path !== "." && path !== context.environment.pwd)
            .map(async(directory) => (await directoriesSuggestionsProvider(context, directory)).map(suggestion => ({...suggestion, label: userFriendlyPath(join(directory, suggestion.label))})))));

        suggestions.push(...cdpathDirectories);
    }

    return suggestions;
});
