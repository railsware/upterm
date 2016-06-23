import {Job} from "./Job";
import {leafNodeAt} from "./shell/Parser2";

export const suggestionsLimit = 9;

export const {getSuggestions} = new class {

    getSuggestions = async (job: Job, caretPosition: number) => {
        const node = leafNodeAt(caretPosition, job.prompt.ast);
        const suggestions = await node.suggestions({environment: job.environment, historicalCurrentDirectoriesStack: job.session.historicalCurrentDirectoriesStack});

        return suggestions.filter(suggestion => suggestion.value.startsWith(node.value)).slice(0, suggestionsLimit);
    };
};
