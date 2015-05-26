import i = require('../Interfaces');
import _ = require('lodash');
import Utils = require('../Utils');

class File implements i.AutocompletionProvider {
    getSuggestions(currentDirectory: string, input: i.Parsable) {
        return new Promise((resolve) => {
            Utils.filesIn(currentDirectory, (files) => {
                if (input.getLexemes().length < 2) {
                    return resolve([]);
                }

                var filtered = _.filter(files, (fileName: string) => {
                    return _.include(fileName.toLowerCase(), input.getLastLexeme().toLowerCase());
                });

                resolve(_.map(filtered, (fileName: string) => {
                    return {
                        value: fileName,
                        priority: 0,
                        synopsis: '',
                        description: '',
                        type: 'file'
                    };
                }));
            });
        });
    }
}

export = File;
