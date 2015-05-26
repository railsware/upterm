import i = require('../Interfaces');
import _ = require('lodash');
import Aliases = require('../Aliases');
import ExecutionHistory = require('../History');
var Fuse: any = require('fuse.js');

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


            var fuse = new Fuse(all, {keys: ['value', 'synopsis']});

            var result = fuse.search(input.getLastLexeme());
            resolve(result);
        });
    }
}

export = History;
