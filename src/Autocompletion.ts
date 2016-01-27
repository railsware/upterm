import * as _ from "lodash";
import * as i from "./Interfaces";
import Job from "./Job";
import PluginManager from "./PluginManager";
import {Suggestion} from "./plugins/autocompletion_providers/Suggestions";
import {lex, expandHistory, expandAliases} from "./CommandExpander";
const score: (i: string, m: string) => number = require("fuzzaldrin").score;

export default class Autocompletion implements i.AutocompletionProvider {
    static limit = 9;

    getSuggestions(job: Job) {
        const finishedLexemes = expandAliases(expandHistory(lex(job.prompt.value).slice(0, -1)));
        let specializedProviders = PluginManager.specializedAutocompletionProviders(finishedLexemes);
        let providers = specializedProviders.length ? specializedProviders : PluginManager.genericAutocompletionProviders;

        // FIXME: skip suggestions that have 0 score.
        return Promise.all(providers.map(provider => provider.getSuggestions(job))).then(results =>
            _._(results)
                .flatten()
                .filter((suggestion: Suggestion) => !suggestion.shouldIgnore(job))
                .sortBy((suggestion: Suggestion) => -score(suggestion.value, suggestion.getPrefix(job)))
                .uniqBy((suggestion: Suggestion) => suggestion.value)
                .take(Autocompletion.limit)
                .value()
        );
    }
}
