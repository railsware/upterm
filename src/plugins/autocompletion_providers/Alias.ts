import {description, styles, style} from "./Suggestions";
import {choice, decorate, Context, string} from "../../shell/Parser";
import {compose, mapObject} from "../../utils/Common";
import {scan, concatTokens} from "../../shell/Scanner";

export const makeAlias = (aliases: Dictionary<string>) => choice(mapObject(aliases, (key, expanded) => choice([
    decorate(string(key), compose(style(styles.alias), description(expanded))),
    async (context: Context) => {
        // if (context.input[0].value.startsWith(key)) {
        //     const results = await command(context.withInput(concatTokens(scan(expanded), context.input.slice(key.length))));
        //     return results.map(result => result.withParse(key + result.parse.slice(expanded.length)));
        // } else {
            return [];
        // }
    },
])));
