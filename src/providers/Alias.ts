import i = require('../Interfaces');
import _ = require('lodash');
import Aliases = require('../Aliases');
var score: (i: string, m: string) => number = require('fuzzaldrin').score;

class Alias implements i.AutocompletionProvider {
    getSuggestions(currentDirectory: string, input: i.Parsable) {
        return new Promise((resolve) => {
            if (input.getLexemes().length > 1) {
                return resolve([]);
            }

            var lexeme = input.getLastLexeme();

            var all = _.map(Aliases.aliases, (expanded: string, alias: string) => {
                return {
                    value: alias,
                    score: 2 * (score(alias, lexeme) + (score(expanded, lexeme) * 0.5)),
                    synopsis: expanded,
                    description: `Aliased to “${expanded}”.`,
                    type: 'alias',
                };
            });

            resolve(_(all).sortBy('score').reverse().take(10).value());
        });
    }
}

export = Alias;
