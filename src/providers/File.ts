import i = require('../Interfaces');
import _ = require('lodash');
import Utils = require('../Utils');

class File implements i.AutocompletionProvider {
    constructor() {
    }

    getSuggestions(currentDirectory: string, input: string, callback: (suggestions: string[]) => void ) {
        Utils.filesIn(currentDirectory, (files) => {
            callback(_.filter(files, (fileName: string) => { return _.include(fileName, input) }));
        });
    }
}

export = File;
