import {statsIn, resolveDirectory} from "../../utils/Common";
import {
    string,
    choice,
    append,
    decorateResult,
    decorate,
    noisySuggestions,
    Parser,
    withoutSuggestions,
} from "../../Parser";
import {type} from "./Suggestions";
import {FileInfo} from "../../Interfaces";

const changingContextDirectory = (parser: Parser) => decorateResult(
    parser,
    result => Object.assign({}, result, {context: Object.assign({}, result.context, {directory: resolveDirectory(result.context.directory, result.parse)})})
);

export const directoryAlias = noisySuggestions(
    choice([
        changingContextDirectory(withoutSuggestions(string("/"))),
        append("/", choice(["~", "..", "."].map(directory => changingContextDirectory(string(directory))))),
    ])
);

export const fileInDirectoryGenerator = async(directory: string, filter: (info: FileInfo) => boolean) => {
    const stats = await statsIn(directory);

    return choice(stats.filter(filter).map(info => {
        const file = decorate(string(info.name), suggestion => suggestion.withDisplayValue(info.name).withValue(info.name.replace(/\s/g, "\\ ")));

        if (info.stat.isDirectory()) {
            return changingContextDirectory(
                info.name.startsWith(".") ? noisySuggestions(decorate(append("/", file), type("directory"))) : decorate(append("/", file), type("directory"))
            );
        } else {
            return info.name.startsWith(".") ? noisySuggestions(decorate(file, type("file"))) : decorate(file, type("file"));
        }
    }));
};
