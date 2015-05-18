import i = require('../Interfaces');
import _ = require('lodash');
import Aliases = require('../Aliases');

class Alias implements i.AutocompletionProvider {
    constructor() {
    }

    getSuggestions(currentDirectory: string, input: string, callback: (suggestions: string[]) => void ) {
        callback(_.filter(_.keys(Aliases.aliases), (alias: string) => { return _.include(alias, input) }));
    }
}

export = Alias;
