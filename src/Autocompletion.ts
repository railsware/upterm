import {leafNodeAt, ASTNode} from "./shell/Parser";
import * as _ from "lodash";
import {Environment} from "./shell/Environment";
import {OrderedSet} from "./utils/OrderedSet";
import {Aliases} from "./shell/Aliases";
import {getHistorySuggestions} from "./plugins/autocompletion_providers/History";

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
    const historySuggestions = getHistorySuggestions(currentText, environment.pwd);

    const uniqueSuggestions = _.uniqBy([...historySuggestions, ...suggestions], suggestion => suggestion.value);

    return {
        isIncomplete: false,
        items: uniqueSuggestions.map(suggestion => ({
            label: suggestion.value,
            detail: suggestion.description,
            kind: monaco.languages.CompletionItemKind.Snippet,
        })),
    };
}
