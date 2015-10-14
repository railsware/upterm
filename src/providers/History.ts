import * as i from '../Interfaces';
import * as _ from 'lodash';
import Aliases from '../Aliases';
import ExecutionHistory from '../History';
import Prompt from "../Prompt";
var score: (i: string, m: string) => number = require('fuzzaldrin').score;

export default class History implements i.AutocompletionProvider {
    async getSuggestions(prompt: Prompt) {
        var lastArgument = prompt.getLastArgument();

        var all = _.map(ExecutionHistory.stack, (entry: string) => {
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
