import * as _ from "lodash";
import * as i from "./Interfaces";
import Job from "./Job";
import PluginManager from "./PluginManager";
const score: (i: string, m: string) => number = require("fuzzaldrin").score;

export default class Autocompletion implements i.AutocompletionProvider {
    static limit = 9;

    getSuggestions(job: Job) {
        let specializedProviders = PluginManager.specializedAutocompletionProviders(job.prompt.expanded);
        let providers = specializedProviders.length ? specializedProviders : PluginManager.genericAutocompletionProviders;

        // FIXME: skip suggestions that have 0 score.
        return Promise.all(providers.map(provider => provider.getSuggestions(job))).then(results =>
            _._(results)
                .flatten()
                .filter((suggestion: i.Suggestion) => !suggestion.isAlreadyOnPrompt(job))
                .sortBy((suggestion: i.Suggestion) => -score(suggestion.value, suggestion.getPrefix(job)))
                .uniqBy((suggestion: i.Suggestion) => suggestion.value)
                .take(Autocompletion.limit)
                .value()
        );
    }
}
