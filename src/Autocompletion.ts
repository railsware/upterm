import {leafNodeAt, ASTNode} from "./shell/Parser";
import * as _ from "lodash";
import {Suggestion} from "./plugins/autocompletion_utils/Common";
import {Environment} from "./shell/Environment";
import {OrderedSet} from "./utils/OrderedSet";
import {Aliases} from "./shell/Aliases";
import {fuzzyMatch} from "./utils/Common";
import {getHistorySuggestions} from "./plugins/autocompletion_providers/History";

const SUGGESTIONS_LIMIT = 7;

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
}: GetSuggestionsOptions): Promise<monaco.languages.CompletionList> {
    const node = leafNodeAt(currentCaretPosition, ast);
    const suggestions = await node.suggestions({
        environment: environment,
        historicalPresentDirectoriesStack: historicalPresentDirectoriesStack,
        aliases: aliases,
    });
    const historySuggestions = getHistorySuggestions(currentText, environment.pwd, suggestions.length ? 3 : SUGGESTIONS_LIMIT);

    const uniqueSuggestions = _.uniqBy([...historySuggestions, ...suggestions], suggestion => suggestion.value);
    const applicableSuggestions: Suggestion[] = uniqueSuggestions.filter(suggestion => suggestion.isFiltered || fuzzyMatch(node.value, suggestion.value));

    return {
        isIncomplete: false,
        items: applicableSuggestions.map(suggestion => ({
            label: suggestion.value,
            detail: suggestion.description,
            kind: monaco.languages.CompletionItemKind.Snippet,
        })),
    };
}
