import i = require('../Interfaces');
import _ = require('lodash');
import Aliases = require('../Aliases');
import ExecutionHistory = require('../History');
var score: (i: string, m: string) => number = require('fuzzaldrin').score;

class History implements i.AutocompletionProvider {
    getSuggestions(currentDirectory: string, input: i.Parsable) {
        return new Promise((resolve) => {
            var lexeme = input.getLastLexeme();

            var all = _.map(ExecutionHistory.stack, (entry: string) => {
                return {
                    value: entry,
                    score: score(entry, lexeme),
                    synopsis: '',
                    description: '',
                    type: 'history'
                };
            });

            resolve(_(all).sortBy('score').reverse().take(10).value());
        });
    }
}

export = History;
