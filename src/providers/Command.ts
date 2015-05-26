import Utils = require('../Utils');
import i = require('../Interfaces');
import _ = require('lodash');
var Fuse: any = require('fuse.js');

class Command implements i.AutocompletionProvider {
    suggestions: i.Suggestion[] = [];

    getSuggestions(currentDirectory: string, input: i.Parsable) {
        return new Promise((resolve) => {
            try {
                input.onParsingError = (err: any, hash: any) => {
                    var filtered = _(hash.expected).filter((value: string) => {
                        return _.include(value, hash.token);
                    }).map((value: string) => {
                        return /^'(.*)'$/.exec(value)[1]
                    }).value();

                    this.suggestions = _.map(filtered, (value: string) => {
                        return {
                            value: value,
                            priority: 0,
                            synopsis: '',
                            description: '',
                            type: value.startsWith('-') ? 'option' : 'command'
                        };
                    });
                };

                input.parse();
                resolve([]);
            } catch (exception) {
                var fuse = new Fuse(this.suggestions, {keys: ['value'], includeScore: true});
                var result = fuse.search(input.getLastLexeme()).map((ranked: i.RankedSuggestion) => {
                    ranked.score *= 10;
                    return ranked;
                });

                resolve(result);
            }
        });
    }
}

export = Command;
