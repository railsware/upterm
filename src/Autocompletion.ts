import * as _ from "lodash";
import * as i from "./Interfaces";
import Job from "./Job";
import PluginManager from "./PluginManager";

export default class Autocompletion implements i.AutocompletionProvider {
    static limit = 9;

    getSuggestions(job: Job) {
        let specializedProviders = PluginManager.specializedAutocompletionProvider(job.prompt.expanded);
        let providers = specializedProviders.length ? specializedProviders : PluginManager.genericAutocompletionProviders;

        return Promise.all(_.map(providers, provider => provider.getSuggestions(job))).then(results =>
            _._(results)
                .flatten()
                .select((suggestion: i.Suggestion) => suggestion.score > 0)
                .sortBy((suggestion: i.Suggestion) => -suggestion.score)
                .uniq("value")
                .take(Autocompletion.limit)
                .value()
        );
    }
}
