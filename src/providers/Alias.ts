import i = require('../Interfaces');
import _ = require('lodash');
import Aliases = require('../Aliases');

class Alias implements i.AutocompletionProvider {
    getSuggestions(currentDirectory: string, input: string) {
        return new Promise((resolve) => {
            var filtered: _.Dictionary<string> = {};

            _.each(Aliases.aliases, (expanded: string, alias: string) => {
                if(_.include(alias, input) || _.include(expanded, input)) {
                    filtered[alias] = expanded
                }
            });

            var mapped: i.Suggestion[] = _.map(filtered, (expanded: string, alias: string) => {
                return {
                    value: alias,
                    priority: 0,
                    synopsis: expanded,
                    description: `Aliased to “${expanded}”.`,
                    type: 'alias',
                };
            });

            resolve(mapped);
        });
    }
}

export = Alias;
