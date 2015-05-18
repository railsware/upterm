import i = require('../Interfaces');
import _ = require('lodash');
import Utils = require('../Utils');

class File implements i.AutocompletionProvider {
    type = 'file';
    constructor() {
    }

    getSuggestions(currentDirectory: string, input: string, callback: (suggestions: i.Suggestion[]) => void ) {
        Utils.filesIn(currentDirectory, (files) => {
            var filtered = _.filter(files, (fileName: string) => { return _.include(fileName, input) });

            callback(_.map(filtered, (fileName: string) => {
                return {
                    value: fileName,
                    synopsis: '',
                    description: ''
                };
            }));
        });
    }
}

export = File;
