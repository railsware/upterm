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
        async (actual: string, context: Context) => {
            if (actual.startsWith(`${key} `)) {
                const results = await command(expanded + actual.slice(key.length), context);
                return results.map(result => Object.assign({}, result, {parse: key + result.parse.slice(expanded.length)}));
            } else {
                return [];
            }
        },
    ])));
});
