import * as i from '../Interfaces';
import * as _ from 'lodash';
import Aliases from '../Aliases';
import ExecutionHistory from '../History';
import Prompt from "../Prompt";
var score: (i: string, m: string) => number = require('fuzzaldrin').score;

export default class History implements i.AutocompletionProvider {
    async getSuggestions(prompt: Prompt) {
        var lastArgument = prompt.lastArgument;

        var all = ExecutionHistory.stack.filter(entry => entry.length > 3).map(entry => {
            return {
                value: entry,
                score: 0.1 * score(entry, lastArgument),
                synopsis: '',
                description: '',
                replaceAll: true,
                type: 'history'
            };
        });

        return _._(all).sortBy('score').reverse().take(10).value();
    }
}
