import {statsIn, resolveDirectory} from "../../utils/Common";
import {
    string,
    choice,
    decorate,
    noisySuggestions,
    Parser,
    withoutSuggestions, runtime, sequence,
} from "../../Parser";
import {styles, style} from "./Suggestions";
import {FileInfo} from "../../Interfaces";

type FileFilter = (info: FileInfo) => boolean;

const pathParser = (name: string) => {
    const parser = name.startsWith(".") ? noisySuggestions(string(name)) : string(name);
    return decorate(parser, suggestion => suggestion.withDisplayValue(name).withValue(suggestion.value.replace(/\s/g, "\\ ")));
};
const fileParser = (info: FileInfo) => decorate(pathParser(info.name), style(styles.file(info)));
const directoryParser = (name: string) => decorate(pathParser(name), style(styles.directory));
const directoryAlias = (workingDirectory: string, filter: FileFilter) => (name: string) => sequence(
    withoutSuggestions(directoryParser(name)),
    pathIn(resolveDirectory(workingDirectory, name), filter)
);

export const pathIn = (directory: string, filter: (info: FileInfo) => boolean): Parser => runtime(async() => {
    const stats = await statsIn(directory);

    return choice([
        ...stats.filter(filter).map(info => {
            if (info.stat.isDirectory()) {
                return sequence(
                    directoryParser(`${info.name}/`),
                    pathIn(resolveDirectory(directory, info.name), filter)
                );
            } else {
                return fileParser(info);
            }
        }),
        ...["./", "../"].map(directoryAlias(directory, filter))
    ]);
});

export const pathInCurrentDirectory = (filter: FileFilter) => runtime(async(context) => choice([
    ...["/", "~/"].map(directoryAlias(context.directory, filter)),
    pathIn(context.directory, filter),
]));
