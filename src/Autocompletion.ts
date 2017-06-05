import {leafNodeAt, ASTNode} from "./shell/Parser";
import * as _ from "lodash";
import {History} from "./shell/History";
import {Suggestion, styles, replaceAllPromptSerializer} from "./plugins/autocompletion_utils/Common";
import {Environment} from "./shell/Environment";
import {OrderedSet} from "./utils/OrderedSet";
import {Aliases} from "./shell/Aliases";

export const suggestionsLimit = 9;

type GetSuggestionsOptions = {
    currentText: string;
    currentCaretPosition: number;
    ast: ASTNode;
    environment: Environment;
    historicalPresentDirectoriesStack: OrderedSet<string>;
    aliases: Aliases;
};

export const getSuggestions = async({
    currentText,
    currentCaretPosition,
    ast,
    environment,
    historicalPresentDirectoriesStack,
    aliases,
}: GetSuggestionsOptions): Promise<Suggestion[]> => {
    const prefixMatchesInHistory = History.all.filter(line => line.startsWith(currentText));
    const suggestionsFromHistory = prefixMatchesInHistory.map(match => new Suggestion({
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
    const applicableSuggestions = uniqueSuggestions.filter(suggestion => suggestion.isFiltered || suggestion.value.toLowerCase().startsWith(node.value.toLowerCase()));

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
