import {isDirectory, statsIn, resolveDirectory} from "../../utils/Common";
import {string, choice, append, runtime, decorateResult, decorate, many1} from "../../Parser";
import {type} from "./Suggestions";

export const file = many1(
    runtime(async (context) => {
        if (!(await isDirectory(context.directory))) {
            return [];
        }

        return choice((await statsIn(context.directory)).map(info => {
            if (info.stat.isDirectory()) {
                return decorateResult(
                    decorate(append("/", string(info.name)), type("directory")),
                    result => Object.assign({}, result, {context: Object.assign({}, result.context, {directory: resolveDirectory(result.context.directory, result.parse)})})
                );
            } else {
                return decorate(string(info.name), type("file"));
            }
        }));
    })
);
