import i = require('../Interfaces');
import _ = require('lodash');
import Aliases = require('../Aliases');
var Fuse: any = require('fuse.js');

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

            var fuse = new Fuse(all, {keys: ['value', 'synopsis'], includeScore: true});

            var result = fuse.search(input.getLastLexeme());
            resolve(result);
        });
    }
}

export = Alias;
