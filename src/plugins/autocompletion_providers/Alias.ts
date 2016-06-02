import {description, styles, style} from "./Suggestions";
import {choice, decorate, Context, string} from "../../Parser";
import {compose, mapObject} from "../../utils/Common";
import {command} from "./Command";

export const makeAlias = (aliases: Dictionary<string>) => choice(mapObject(aliases, (key, expanded) => choice([
    decorate(string(key), compose(style(styles.alias), description(expanded))),
    async (context: Context) => {
        if (context.input.startsWith(key)) {
            const results = await command(Object.assign({}, context, {input: expanded + context.input.slice(key.length)}));
            return results.map(result => Object.assign({}, result, {parse: key + result.parse.slice(expanded.length)}));
        } else {
            return [];
        }
    },
])));
