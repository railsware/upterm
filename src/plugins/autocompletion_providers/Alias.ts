import * as _ from "lodash";
import Aliases from "../../Aliases";
import {description, type} from "./Suggestions";
import {runtime, string, choice, decorate} from "../../Parser";
import {compose} from "../../utils/Common";

export const alias = runtime(async () => {
    const aliases = await Aliases.all();
    return choice(_.map(aliases, (expanded, key) => decorate(string(key), compose(type("alias"), description(expanded)))));
});
