import * as _ from "lodash";
import Aliases from "../../Aliases";
import {description, type} from "./Suggestions";
import {runtime, choice, decorate, Context, string, token} from "../../Parser";
import {compose} from "../../utils/Common";
import {command} from "../../Autocompletion";

export const alias = runtime(async () => {
    const aliases = await Aliases.all();

    return choice(_.map(aliases, (expanded, key) => choice([
        decorate(token(string(key)), compose(type("alias"), description(expanded))),
        async (context: Context) => {
            if (context.input.startsWith(`${key} `)) {
                const results = await command(Object.assign({}, context, {input: expanded + context.input.slice(key.length)}));
                return results.map(result => Object.assign({}, result, {parse: key + result.parse.slice(expanded.length)}));
            } else {
                return [];
            }
        },
    ])));
});
