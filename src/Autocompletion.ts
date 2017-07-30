import {leafNodeAt, ASTNode} from "./shell/Parser";
import * as _ from "lodash";
import {HistoryService} from "./services/HistoryService";
import {
    styles, replaceAllPromptSerializer, Suggestion,
    SuggestionWithDefaults, addDefaultAttributeValues,
} from "./plugins/autocompletion_utils/Common";
import {Environment} from "./shell/Environment";
import {OrderedSet} from "./utils/OrderedSet";
import {Aliases} from "./shell/Aliases";
import {fuzzyMatch} from "./utils/Common";

export const suggestionsLimit = 5;

type GetSuggestionsOptions = {
    currentText: string;
    currentCaretPosition: number;
    ast: ASTNode;
    environment: Environment;
    historicalPresentDirectoriesStack: OrderedSet<string>;
    aliases: Aliases;
};

export async function getSuggestions({
    currentText,
    currentCaretPosition,
    ast,
    environment,
    historicalPresentDirectoriesStack,
    aliases,
}: GetSuggestionsOptions): Promise<SuggestionWithDefaults[]> {
    const prefixMatchesInHistory: string[] = HistoryService.all.map(historyRecord => historyRecord.command).filter(command => fuzzyMatch(currentText, command));
    const suggestionsFromHistory = prefixMatchesInHistory.map(match => ({
        value: match,
        promptSerializer: replaceAllPromptSerializer,
        isFiltered: true,
        style: styles.history,
    }));

    const firstThreeFromHistory = suggestionsFromHistory.slice(0, 3);
    const remainderFromHistory = suggestionsFromHistory.slice(3);

    const node = leafNodeAt(currentCaretPosition, ast);
    const suggestions = await node.suggestions({
        environment: environment,
        historicalPresentDirectoriesStack: historicalPresentDirectoriesStack,
        aliases: aliases,
    });

    const uniqueSuggestions = _.uniqBy([...firstThreeFromHistory, ...suggestions, ...remainderFromHistory], suggestion => suggestion.value);
    const applicableSuggestions: Suggestion[] = uniqueSuggestions.filter(suggestion => suggestion.isFiltered || fuzzyMatch(node.value, suggestion.value));

    if (applicableSuggestions.length === 1) {
        const suggestion = applicableSuggestions[0];

        /**
         * The suggestion would simply duplicate the prompt value without providing no
         * additional information. Skipping it for clarity.
         */
        if (node.value === suggestion.value && (suggestion.description && suggestion.description.length === 0) && (suggestion.synopsis && suggestion.synopsis.length === 0)) {
            return [];
        }
    }

    return applicableSuggestions.slice(0, suggestionsLimit).map(addDefaultAttributeValues);
}
