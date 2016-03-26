import * as _ from "lodash";
import * as i from "./Interfaces";
import Job from "./Job";
import PluginManager from "./PluginManager";
import {Suggestion} from "./plugins/autocompletion_providers/Suggestions";
const score: (i: string, m: string) => number = require("fuzzaldrin").score;

export default class Autocompletion implements i.AutocompletionProvider {
    static limit = 9;

    async getSuggestions(job: Job) {
        let specializedProviders = PluginManager.specializedAutocompletionProviders(job.prompt.expandedFinishedLexemes);
        let providers = specializedProviders.length ? specializedProviders : PluginManager.genericAutocompletionProviders;

        const suggestions: Suggestion[][] = await Promise.all(providers.map(provider => provider.getSuggestions(job)));
        const scoredSuggestions = _.flatten(suggestions)
            .filter(suggestion => !suggestion.shouldIgnore(job))
            .map(suggestion => {
                return {suggestion: suggestion, score: score(suggestion.value, suggestion.getPrefix(job))};
            })
            .filter(wrapper => wrapper.score > 0)
            .sort(wrapper => -wrapper.score)
            .map(wrapper => wrapper.suggestion);

        return _.uniqBy(scoredSuggestions, suggestion => suggestion.value).slice(0, Autocompletion.limit);
    }
}
