import Utils from '../Utils';
import * as i from '../Interfaces';
import * as _ from 'lodash';
import Prompt from "../Prompt";
var filter: any = require('fuzzaldrin').filter;
import History from '../History';

export default class HistoryExpansion implements i.AutocompletionProvider {
    suggestions: i.Suggestion[] = [];

    async getSuggestions(prompt: Prompt) {
        if (prompt.getWholeCommand().length > 1) {
            return [];
        }

        if (prompt.getLastArgument().startsWith('!')) {
            return [{
                value: History.last,
                score: 1,
                synopsis: '!!',
                description: 'Previous command',
                type: 'history-expansion',
            }]
        } else {
            return [];
        }
    }
}
