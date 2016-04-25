import * as _ from "lodash";
import * as i from "./Interfaces";
import Job from "./Job";
import {choice, token, executable} from "./Parser";
import {commandDescriptions} from "./plugins/autocompletion_providers/Executable";
const score: (i: string, m: string) => number = require("fuzzaldrin").score;

export default class Autocompletion implements i.AutocompletionProvider {
    static limit = 9;

    async getSuggestions(job: Job) {
        if (window.DEBUG) {
            /* tslint:disable:no-console */
            console.time(`suggestion for '${job.prompt.value}'`);
        }

        const gitCommand = choice([
            token("commit"),
            token("add"),
            token("checkout"),
        ]);
        const git = executable("git").bind(gitCommand);
        const ls = executable("ls");
        const exec = choice(_.map(commandDescriptions, (value, key) =>
            executable(key).decorate(suggestion => suggestion.withDescription(value))
        ));
        const command = choice([
            ls,
            git,
        ]);
        const sudo = token("sudo").bind(command);
        const anyCommand = choice([
            sudo,
            command,
            exec,
        ]);
        const separator = choice([
            token("&&"),
            token(";"),
        ]);
        const grammar = anyCommand.bind(separator).bind(anyCommand);

        const applied = await grammar.parse(job.prompt.value);
        const scoredSuggestions = applied.suggestions
            .filter(suggestion => !suggestion.shouldIgnore(job))
            .map(suggestion => ({suggestion: suggestion, score: score(suggestion.value, suggestion.getPrefix(job))}))
            .filter(wrapper => wrapper.score > 0)
            .sort(wrapper => -wrapper.score)
            .map(wrapper => wrapper.suggestion);

        const unique = _.uniqBy(scoredSuggestions, suggestion => suggestion.value).slice(0, Autocompletion.limit);

        if (window.DEBUG) {
            /* tslint:disable:no-console */
            console.timeEnd(`suggestion for '${job.prompt.value}'`);
        }

        return unique;
    }
}
