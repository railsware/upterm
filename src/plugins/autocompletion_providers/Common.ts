import {statsIn, resolveDirectory, directoryName, joinPath} from "../../utils/Common";
import {styles, Suggestion} from "./Suggestions";
import {FileInfo, SuggestionContext, AutocompletionProvider} from "../../Interfaces";
import * as Path from "path";
import * as modeToPermissions from "mode-to-permissions";

function escapePath(path: string) {
    return path.replace(/\s/g, "\\ ");
}

const filesSuggestions = (filter: (info: FileInfo) => boolean) => async(tokenValue: string, directory: string): Promise<Suggestion[]> => {
    const tokenDirectory = directoryName(tokenValue);
    const basePath = tokenValue.slice(tokenDirectory.length);
    const directoryPath = resolveDirectory(directory, tokenDirectory);
    const stats = await statsIn(directoryPath);

    return stats
        .filter(info => info.name.startsWith(".") ? basePath.startsWith(".") : true)
        .filter(info => info.stat.isDirectory() || filter(info))
        .map(info => {
            if (info.stat.isDirectory()) {
                return new Suggestion().withValue(escapePath(joinPath(tokenDirectory, info.name + Path.sep))).withDisplayValue(info.name + Path.sep).withStyle(styles.directory);
            } else {
                return new Suggestion().withValue(escapePath(joinPath(tokenDirectory, info.name)) + " ").withDisplayValue(info.name).withStyle(styles.file(info));
            }
        });
};

const filesSuggestionsProvider =
    (filter: (info: FileInfo) => boolean) =>
        (context: SuggestionContext, directory = context.environment.pwd): Promise<Suggestion[]> =>
            filesSuggestions(filter)(context.argument.value, directory);

export const executableFilesSuggestions = filesSuggestions(info => info.stat.isFile() && modeToPermissions(info.stat.mode).execute.owner);
export const anyFilesSuggestionsProvider = filesSuggestionsProvider(() => true);
export const directoriesSuggestionsProvider = filesSuggestionsProvider(info => info.stat.isDirectory());

export const environmentVariableSuggestions = async(context: SuggestionContext): Promise<Suggestion[]> => {
    if (context.argument.value.startsWith("$")) {
        return context.environment.map((key, value) =>
            new Suggestion().withValue("$" + key).withDescription(value).withStyle(styles.environmentVariable)
        );
    } else {
        return [];
    }
};

export const combineAutocompletionProviders = (providers: AutocompletionProvider[]): AutocompletionProvider => async(context: SuggestionContext): Promise<Suggestion[]> => {
    let suggestions: Suggestion[] = [];

    for (const provider of providers) {
        if (Array.isArray(provider)) {
            suggestions = suggestions.concat(provider);
        } else {
            suggestions = suggestions.concat(await provider(context));
        }
    }

    return suggestions;
};
