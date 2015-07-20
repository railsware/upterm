import i = require('../Interfaces');
import _ = require('lodash');
import Aliases = require('../Aliases');
import Prompt = require("../Prompt");
var score: (i: string, m: string) => number = require('fuzzaldrin').score;

class Alias implements i.AutocompletionProvider {
    getSuggestions(prompt: Prompt) {
        return new Promise((resolve) => {
            if (prompt.getWholeCommand().length > 1) {
                return resolve([]);
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

            resolve(_(all).sortBy('score').reverse().take(10).value());
        });
    }
}

export = Alias;
