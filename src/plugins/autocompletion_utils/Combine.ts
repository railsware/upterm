import * as _ from "lodash";
import {AutocompletionContext, AutocompletionProvider} from "../../Interfaces";
import {Suggestion} from "./Common";

export default (providers: AutocompletionProvider[]): AutocompletionProvider => {
    return async(context: AutocompletionContext): Promise<Suggestion[]> => {
        return _.flatten(await Promise.all(providers.map(provider => provider(context))));
    };
};
