import {statsIn, resolveDirectory} from "../../utils/Common";
import {
    string,
    choice,
    append,
    decorateResult,
    decorate,
    noisySuggestions,
    Parser,
    withoutSuggestions, runtime, many1,
} from "../../Parser";
import {styles, style} from "./Suggestions";
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

const fileName = (name: string) => decorate(string(name), suggestion => suggestion.withDisplayValue(name).withValue(suggestion.value.replace(/\s/g, "\\ ")));

export const pathPart = async(directory: string, filter: (info: FileInfo) => boolean) => {
    const stats = await statsIn(directory);

    return choice(stats.filter(filter).map(info => {
        if (info.stat.isDirectory()) {
            const styledDirectory = decorate(fileName(`${info.name}/`), style(styles.directory));
            return changingContextDirectory(info.name.startsWith(".") ? noisySuggestions(styledDirectory) : styledDirectory);
        } else {
            const styled = decorate(fileName(info.name), style(styles.file(info)));
            return info.name.startsWith(".") ? noisySuggestions(styled) : styled;
        }
    }));
};

export const pathInCurrentDirectory = (filter: (info: FileInfo) => boolean) => many1(
    runtime(
        async(context) => choice([directoryAlias].concat(await pathPart(context.directory, filter)))
    )
);
