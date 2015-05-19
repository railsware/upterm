import i = require('../Interfaces');
import _ = require('lodash');
import Aliases = require('../Aliases');
import ExecutionHistory = require('../History');

class History implements i.AutocompletionProvider {
    type = 'history';

    constructor() {
    }

    getSuggestions(currentDirectory: string, input: string, callback: (suggestions: i.Suggestion[]) => void ) {
        var mapped: i.Suggestion[] = _.map(ExecutionHistory.stack, (entry: string) => {
            return {
                value: entry,
                priority: 0,
                synopsis: '',
                description: ''
            };
        });

        callback(mapped);
    }
}

export = History;
