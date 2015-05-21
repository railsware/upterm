import i = require('../Interfaces');
import _ = require('lodash');
import Utils = require('../Utils');

class File implements i.AutocompletionProvider {
    getSuggestions(currentDirectory: string, input: string) {
        return new Promise((resolve) => {
            Utils.filesIn(currentDirectory, (files) => {
                var filtered = _.filter(files, (fileName: string) => {
                    return _.include(fileName, input)
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
