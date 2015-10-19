import Utils from '../Utils';
import * as i from '../Interfaces';
import * as _ from 'lodash';
import Prompt from "../Prompt";
var filter: any = require('fuzzaldrin').filter;
import History from '../History';
import {historyCommands, isCompleteHistoryCommand, historyReplacement} from '../CommandExpander';

export default class HistoryExpansion implements i.AutocompletionProvider {
    suggestions: i.Suggestion[] = [];

    async getSuggestions(prompt: Prompt) {
        const lexeme = prompt.lastLexeme;

        if (isCompleteHistoryCommand(lexeme)) {
            return [{
                value: lexeme,
                score: 1,
                synopsis: historyReplacement(lexeme).join(' '),
                description: 'Previous command',
                type: 'history-expansion',
            }]
        } else if (lexeme.startsWith('!')) {
            return _.map(historyCommands, (command, description) => {
                return {
                    value: command,
                    score: 1,
                    synopsis: historyReplacement(command).join(' '),
                    description: description,
                    type: 'history-expansion',
                }
            })
        } else {
            return [];
        }
    }
}
