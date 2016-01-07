import * as _ from "lodash";
import * as i from "./Interfaces";
import Job from "./Job";
import PluginManager from "./PluginManager";

export default class Autocompletion implements i.AutocompletionProvider {
    static limit = 9;

    getSuggestions(job: Job) {
        return Promise.all(_.map(PluginManager.autocompletionProviders, provider => provider.getSuggestions(job))).then(results =>
            _._(results)
                .flatten()
                .select((suggestion: Suggestion) => suggestion.score > 0)
                .sortBy((suggestion: Suggestion) => -suggestion.score)
                .uniq("value")
                .take(Autocompletion.limit)
                .value()
        );
    }
}
