import Utils = require('../Utils');
import i = require('../Interfaces');
import _ = require('lodash');
import Language = require('../Language');

class Command implements i.AutocompletionProvider {
    language = new Language();
    suggestions: i.Suggestion[] = [];

    constructor() {
        this.language.onParsingError = (err: any, hash: any) => {
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
    }

    getSuggestions(currentDirectory: string, input: string) {
        return new Promise((resolve) => {
            try {
                this.language.parse(input);
                resolve([]);
            } catch (exception) {
                resolve(this.suggestions);
            }
        });
    }
}

export = Command;
