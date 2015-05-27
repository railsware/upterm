import i = require('../Interfaces');
import _ = require('lodash');
import Aliases = require('../Aliases');
import ExecutionHistory = require('../History');
var filter: any = require('fuzzaldrin').filter;

class History implements i.AutocompletionProvider {
    getSuggestions(currentDirectory: string, input: i.Parsable) {
        return new Promise((resolve) => {
            var all = _.map(ExecutionHistory.stack, (entry: string) => {
                return {
                    value: entry,
                    priority: 0,
                    synopsis: '',
                    description: '',
                    type: 'history'
                };
            });


            resolve(filter(all, input.getLastLexeme(), {key: 'value', maxResults: 30}));
        });
    }
}

export = History;
