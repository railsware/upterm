import i = require('../Interfaces');
import _ = require('lodash');
import Aliases = require('../Aliases');
var filter: any = require('fuzzaldrin').filter;

class Alias implements i.AutocompletionProvider {
    getSuggestions(currentDirectory: string, input: i.Parsable) {
        return new Promise((resolve) => {
            if (input.getLexemes().length > 1) {
                return resolve([]);
            }

            var all = _.map(Aliases.aliases, (expanded: string, alias: string) => {
                return {
                    value: alias,
                    score: 1,
                    synopsis: expanded,
                    description: `Aliased to “${expanded}”.`,
                    type: 'alias',
                };
            });
            var byValue = filter(all, input.getLastLexeme(), {key: 'value', maxResults: 10});

            var bySynopsis = _.clone(filter(_.difference(all, byValue), input.getLastLexeme(), {key: 'synopsis', maxResults: 10}))
                .map((suggestion: i.Suggestion) => {
                suggestion.score = -1;
                return suggestion;
            });

            resolve(byValue.concat(bySynopsis));
        });
    }
}

export = Alias;
