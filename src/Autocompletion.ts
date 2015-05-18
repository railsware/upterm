import Executable = require('./providers/Executable');
import File = require('./providers/File');
import _ = require('lodash');
import i = require('./Interfaces');

class Autocompletion implements i.AutocompletionProvider {
    executableCompletions: Executable;
    fileCompletion: File;

    constructor() {
        this.executableCompletions = new Executable();
    }

    getSuggestions(currentDirectory: string, input: string, callback: (suggestions: string[]) => void) {
        this.executableCompletions.getSuggestions(currentDirectory, input, callback);
    }
}

export = Autocompletion;
