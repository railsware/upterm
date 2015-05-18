import i = require('../Interfaces');
import Utils = require('../Utils');

class File implements i.AutocompletionProvider {
    constructor() {
    }

    getSuggestions(currentDirectory: string, input: string, callback: (suggestions: string[]) => void ) {
        callback([]);
    }
}

export = File;
