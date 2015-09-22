import * as i from '../Interfaces';
import * as _ from 'lodash';
import Aliases from '../Aliases';
import ExecutionHistory from '../History';
import Prompt from "../Prompt";
var score: (i: string, m: string) => number = require('fuzzaldrin').score;

export default class History implements i.AutocompletionProvider {
    getSuggestions(prompt: Prompt) {
        return new Promise((resolve) => {
            var lastArgument = prompt.getLastArgument();

            var all = _.map(ExecutionHistory.stack, (entry: string) => {
                return {
                    value: entry,
                    score: 0.1 * score(entry, lastArgument),
                    synopsis: '',
                    description: '',
                    type: 'history'
                };
            });

            resolve(_._(all).sortBy('score').reverse().take(10).value());
        });
    }
}
