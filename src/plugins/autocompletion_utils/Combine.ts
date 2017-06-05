import * as _ from "lodash";
import {AutocompletionContext, AutocompletionProvider} from "../../Interfaces";
import {PartialSuggestion} from "./Common";

export default (providers: AutocompletionProvider[]): AutocompletionProvider => {
    return async(context: AutocompletionContext): Promise<PartialSuggestion[]> => {
        return _.flatten(await Promise.all(providers.map(provider => provider(context))));
    };
};
