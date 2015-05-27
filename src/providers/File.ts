import i = require('../Interfaces');
import _ = require('lodash');
import Utils = require('../Utils');
var filter: any = require('fuzzaldrin').filter;

class File implements i.AutocompletionProvider {
    getSuggestions(currentDirectory: string, input: i.Parsable) {
        return new Promise((resolve) => {
            Utils.filesIn(currentDirectory, (files) => {
                if (input.getLexemes().length < 2) {
                    return resolve([]);
                }

                var all = _.map(files, (fileName: string) => {
                    return {
                        value: fileName,
                        priority: 0,
                        synopsis: '',
                        description: '',
                        type: 'file'
                    };
                });

                resolve(filter(all, input.getLastLexeme(), {key: 'value', maxResults: 30}));
            });
        });
    }
}

export = File;
