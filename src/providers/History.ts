import i = require('../Interfaces');
import _ = require('lodash');
import Aliases = require('../Aliases');
import ExecutionHistory = require('../History');
import Prompt = require("../Prompt");
var score: (i: string, m: string) => number = require('fuzzaldrin').score;

class History implements i.AutocompletionProvider {
    getSuggestions(prompt: Prompt) {
        return new Promise((resolve) => {
            var lastArgument = prompt.getLastArgument();

            var all = _.map(ExecutionHistory.stack, (entry: string) => {
                return {
                    value: entry,
                    score: 0.1 * score(entry, lastArgument),
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
