import {Job} from "./shell/Job";
import {leafNodeAt} from "./shell/Parser";
import * as _ from "lodash";
import {History} from "./shell/History";
import {Suggestion, styles, replaceAllPromptSerializer} from "./plugins/autocompletion_providers/Common";

export const suggestionsLimit = 9;

export const getSuggestions = async(job: Job, caretPosition: number) => {
    const prefixMatchesInHistory = History.all.filter(line => line.startsWith(job.prompt.value));
    const suggestionsFromHistory = prefixMatchesInHistory.map(match => new Suggestion({
        value: match,
        promptSerializer: replaceAllPromptSerializer,
        style: styles.history,
    }));

    const firstThreeFromHistory = suggestionsFromHistory.slice(0, 3);
    const remainderFromHistory = suggestionsFromHistory.slice(3);

    const node = leafNodeAt(caretPosition, job.prompt.ast);
    const suggestions = await node.suggestions({
        environment: job.environment,
        historicalPresentDirectoriesStack: job.session.historicalPresentDirectoriesStack,
        aliases: job.session.aliases,
    });

    const applicableSuggestions = _.uniqBy([...firstThreeFromHistory, ...suggestions, ...remainderFromHistory], suggestion => suggestion.value).filter(suggestion =>
        suggestion.value.toLowerCase().startsWith(node.value.toLowerCase())
    );

    if (applicableSuggestions.length === 1) {
        const suggestion = applicableSuggestions[0];

        /**
         * The suggestion would simply duplicate the prompt value without providing no
         * additional information. Skipping it for clarity.
         */
        if (node.value === suggestion.value && suggestion.description.length === 0 && suggestion.synopsis.length === 0) {
            return [];
        }
    }

    return applicableSuggestions.slice(0, suggestionsLimit);
};
