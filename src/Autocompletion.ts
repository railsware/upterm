import {Job} from "./shell/Job";
import {leafNodeAt} from "./shell/Parser";

export const suggestionsLimit = 9;

export const getSuggestions = async(job: Job, caretPosition: number) => {
    const node = leafNodeAt(caretPosition, job.prompt.ast);
    const suggestions = await node.suggestions({
        environment: job.environment,
        historicalPresentDirectoriesStack: job.session.historicalPresentDirectoriesStack,
        aliases: job.session.aliases,
    });

    const applicableSuggestions = suggestions.filter(suggestion => suggestion.value.toLowerCase().startsWith(node.value.toLowerCase()));

    return _.uniqBy(applicableSuggestions, suggestion => suggestion.value).slice(0, suggestionsLimit);
};
