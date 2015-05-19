import i = require('../Interfaces');
import _ = require('lodash');
import Aliases = require('../Aliases');

class Alias implements i.AutocompletionProvider {
    type = 'alias';

    constructor() {
    }

    getSuggestions(currentDirectory: string, input: string, callback: (suggestions: i.Suggestion[]) => void ) {
        var filtered: _.Dictionary<string> = {};

        _.each(Aliases.aliases, (expanded: string, alias: string) => {
            if(_.include(alias, input)) {
                filtered[alias] = expanded
            }
        });

        var mapped: i.Suggestion[] = _.map(filtered, (expanded: string, alias: string) => {
            return {
                value: alias,
                priority: 0,
                synopsis: expanded,
                description: `Aliased to “${expanded}”.`
            };
        });

        callback(mapped);
    }
}

export = Alias;
