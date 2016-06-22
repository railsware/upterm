import {statsIn, resolveDirectory, directoryName} from "../../utils/Common";
import {styles, Suggestion} from "./Suggestions";
import {FileInfo, SuggestionContext, AutocompletionProvider} from "../../Interfaces";
import * as Path from "path";

function pathSuggestion(directory: string, path: string) {
    return new Suggestion().withValue(Path.join(directory, path).replace(/\s/g, "\\ ")).withDisplayValue(path);
}

export const filesSuggestions = (filter: (info: FileInfo) => boolean) => async (context: SuggestionContext, directory = context.environment.pwd): Promise<Suggestion[]> => {
    const tokenDirectory = directoryName(context.argument.value);
    const directoryPath = resolveDirectory(directory, tokenDirectory);
    const stats = await statsIn(directoryPath);

    return stats.filter(filter).map(info => {
        if (info.stat.isDirectory()) {
            return pathSuggestion(tokenDirectory, info.name + Path.sep).withStyle(styles.directory);
        } else {
            return pathSuggestion(tokenDirectory, info.name).withStyle(styles.file(info));
        }
    });
};

export const anyFilesSuggestions = filesSuggestions(() => true);
export const directoriesSuggestions = filesSuggestions(info => info.stat.isDirectory());

export const environmentVariableSuggestions = async (context: SuggestionContext): Promise<Suggestion[]> => {
    if (context.argument.value.startsWith("$")) {
        return context.environment.map((key, value) =>
            new Suggestion().withValue("$" + key).withDescription(value).withStyle(styles.environmentVariable)
        );
    } else {
        return [];
    }
};

export const combineAutocompletionProviders = (providers: AutocompletionProvider[]): AutocompletionProvider => async (context: SuggestionContext): Promise<Suggestion[]> => {
    return _.flatten(await Promise.all(providers.map(provider => provider(context))));
};

export const staticProvider = (suggestions: Suggestion[]): AutocompletionProvider => async (context: SuggestionContext): Promise<Suggestion[]> => suggestions;
