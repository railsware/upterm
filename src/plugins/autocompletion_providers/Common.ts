import {statsIn, resolveDirectory, directoryName} from "../../utils/Common";
import {
    string,
    choice,
    decorate,
    noisySuggestions,
    Parser,
    withoutSuggestions, runtime, sequence,
} from "../../shell/Parser";
import {styles, style, Suggestion} from "./Suggestions";
import {FileInfo, SuggestionContext} from "../../Interfaces";
import * as Path from "path";

type FileFilter = (info: FileInfo) => boolean;

const pathParser = (name: string) => {
    const parser = name.startsWith(".") ? noisySuggestions(string(name)) : string(name);
    return decorate(parser, suggestion => suggestion.withDisplayValue(name).withValue(suggestion.value.replace(/\s/g, "\\ ")));
};

const directoryParser = (name: string) => decorate(pathParser(name), style(styles.directory));
const directoryAlias = (workingDirectory: string, filter: FileFilter) => (name: string) => sequence(
    withoutSuggestions(directoryParser(name)),
    pathIn(resolveDirectory(workingDirectory, name), filter)
);

export function pathIn(directory: string, filter: (info: FileInfo) => boolean): Parser {
    return runtime(async() => {
        return choice([]);
    });
}

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

export const directoriesSuggestions = filesSuggestions(info => info.stat.isDirectory());

export const pathInCurrentDirectory = (filter: FileFilter) => runtime(async(context) => choice([
    ...["/", "~/"].map(directoryAlias(context.directory, filter)),
    pathIn(context.directory, filter),
]));
