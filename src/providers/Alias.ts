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
                    priority: 0,
                    synopsis: expanded,
                    description: `Aliased to “${expanded}”.`,
                    type: 'alias',
                };
            });

            resolve(filter(all, input.getLastLexeme(), {key: 'value', maxResults: 30}));
        });
    }
}

export = Alias;
