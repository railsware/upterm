import * as _ from "lodash";
import * as i from "./Interfaces";
import Job from "./Job";
import PluginManager from "./PluginManager";
import {Suggestion} from "./plugins/autocompletion_providers/Suggestions";
const score: (i: string, m: string) => number = require("fuzzaldrin").score;

export default class Autocompletion implements i.AutocompletionProvider {
    static limit = 9;

    getSuggestions(job: Job) {
        let specializedProviders = PluginManager.specializedAutocompletionProviders(job.prompt.expandedFinishedLexemes);
        let providers = specializedProviders.length ? specializedProviders : PluginManager.genericAutocompletionProviders;

        return Promise.all(providers.map(provider => provider.getSuggestions(job))).then(results =>
            _._(results)
                .flatten()
                .filter((suggestion: Suggestion) =>
                    !suggestion.shouldIgnore(job) &&
                    score(suggestion.value, suggestion.getPrefix(job)) > 0)
                .sortBy((suggestion: Suggestion) => -score(suggestion.value, suggestion.getPrefix(job)))
                .uniqBy((suggestion: Suggestion) => suggestion.value)
                .take(Autocompletion.limit)
                .value()
        );
    }
}
