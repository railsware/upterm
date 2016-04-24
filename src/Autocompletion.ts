import * as _ from "lodash";
import * as i from "./Interfaces";
import Job from "./Job";
import PluginManager from "./PluginManager";
import {Suggestion} from "./plugins/autocompletion_providers/Suggestions";
import {choice, token} from "./Parser";
const score: (i: string, m: string) => number = require("fuzzaldrin").score;

const gitCommand = choice([
    token("commit"),
    token("add"),
    token("checkout"),
]);
const git = token("git").bind(gitCommand);
const ls = token("ls");

const command = choice([
    ls,
    git,
]);

const sudo = token("sudo").bind(command);
const anyCommand = choice([
    sudo,
    command,
]);

const separator = choice([
    token("&&"),
    token(";"),
]);

const grammar = anyCommand.bind(separator).bind(anyCommand);

export default class Autocompletion implements i.AutocompletionProvider {
    static limit = 9;

    // async getSuggestions(job: Job) {
    //     let specializedProviders = PluginManager.specializedAutocompletionProviders(job.prompt.expandedFinishedLexemes);
    //     let providers = specializedProviders.length ? specializedProviders : PluginManager.genericAutocompletionProviders;
    //
    //     const suggestions: Suggestion[][] = await Promise.all(providers.map(provider => provider.getSuggestions(job)));
    //     const scoredSuggestions = _.flatten(suggestions)
    //         .filter(suggestion => !suggestion.shouldIgnore(job))
    //         .map(suggestion => {
    //             return {suggestion: suggestion, score: score(suggestion.value, suggestion.getPrefix(job))};
    //         })
    //         .filter(wrapper => wrapper.score > 0)
    //         .sort(wrapper => -wrapper.score)
    //         .map(wrapper => wrapper.suggestion);
    //
    //     return _.uniqBy(scoredSuggestions, suggestion => suggestion.value).slice(0, Autocompletion.limit);
    // }

    async getSuggestions(job: Job) {
        const applied = await grammar.parse(job.prompt.value);
        return applied.suggestions.map(suggestion => new Suggestion().withValue(suggestion.prefix + suggestion.value));
    }
}
