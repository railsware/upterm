import {Job} from "./shell/Job";
import {leafNodeAt} from "./shell/Parser";
import * as _ from "lodash";

export const suggestionsLimit = 9;

export const getSuggestions = async(job: Job, caretPosition: number) => {
    const node = leafNodeAt(caretPosition, job.prompt.ast);
    const suggestions = await node.suggestions({
        environment: job.environment,
        historicalPresentDirectoriesStack: job.session.historicalPresentDirectoriesStack,
        aliases: job.session.aliases,
    });

    const applicableSuggestions = _.uniqBy(suggestions, suggestion => suggestion.value).filter(suggestion =>
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
