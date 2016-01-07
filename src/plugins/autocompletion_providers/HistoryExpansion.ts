import Utils from '../../Utils';
import * as i from '../../Interfaces';
import * as _ from 'lodash';
import Prompt from "../../Prompt";
import History from '../../History';
import {isCompleteHistoryCommand, historyReplacement} from '../../CommandExpander';
import PluginManager from "../../PluginManager";

class HistoryExpansion implements i.AutocompletionProvider {
    suggestions: Suggestion[] = [];

    private static descriptions: _.Dictionary<string> = {
        '!!': 'The previous command',
        '!^': 'The first argument of the previous command',
        '!$': 'The last argument of the previous command',
        '!*': 'All arguments of the previous command',
    };

    async getSuggestions(prompt: Prompt): Promise<Suggestion[]> {
        const lexeme = prompt.lastLexeme;

        return _.map(this.commands(lexeme), (description, command) => {
            return {
                value: command,
                score: 4,
                synopsis: historyReplacement(command).join(' '),
                description: description,
                type: 'history-expansion',
            }
        })
    }

    private commands(lexeme: string): _.Dictionary<string> {
        if (isCompleteHistoryCommand(lexeme)) {
            return { [lexeme]: HistoryExpansion.descriptions[lexeme] };
        } else if (lexeme.startsWith('!')) {
            return HistoryExpansion.descriptions;
        } else {
            return {};
        }
    }
}

PluginManager.registerAutocompletionProvider(new HistoryExpansion());
