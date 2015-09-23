import * as i from '../Interfaces';
import * as _ from 'lodash';
import Aliases from '../Aliases';
import Prompt from "../Prompt";
var score: (i: string, m: string) => number = require('fuzzaldrin').score;

export default class Alias implements i.AutocompletionProvider {
    async getSuggestions(prompt: Prompt) {
            if (prompt.getWholeCommand().length > 1) {
                return [];
            }

            var lastArgument = prompt.getLastArgument();

            var all = _.map(Aliases.aliases, (expanded: string, alias: string) => {
                return {
                    value: alias,
                    score: 2 * (score(alias, lastArgument) + (score(expanded, lastArgument) * 0.5)),
                    synopsis: expanded,
                    description: `Aliased to “${expanded}”.`,
                    type: 'alias',
                }
            });

            return _._(all).sortBy('score').reverse().take(10).value();
    }
}
