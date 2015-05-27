import Utils = require('../Utils');
import i = require('../Interfaces');
import _ = require('lodash');
var filter: any = require('fuzzaldrin').filter;

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
                            score: 10,
                            synopsis: '',
                            description: '',
                            type: value.startsWith('-') ? 'option' : 'command'
                        };
                    });
                };

                input.parse();
                resolve([]);
            } catch (exception) {
                resolve(filter(this.suggestions, input.getLastLexeme(), {key: 'value', maxResults: 30}));
            }
        });
    }
}

export = Command;
