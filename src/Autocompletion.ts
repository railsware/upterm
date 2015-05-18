import Executable = require('./providers/Executable');
import File = require('./providers/File');
import _ = require('lodash');
import i = require('./Interfaces');

class Autocompletion implements i.AutocompletionProvider {
    executableCompletions: Executable;
    fileCompletion: File;

    constructor() {
        this.executableCompletions = new Executable();
        this.fileCompletion = new File();
    }

    getSuggestions(currentDirectory: string, input: string, callback: (suggestions: string[]) => void) {
        //TODO: flatten.
        this.executableCompletions.getSuggestions(currentDirectory, input, (executables) => {
            this.fileCompletion.getSuggestions(currentDirectory, input, (files) => {
                callback(executables.concat(files));
            });
        });
    }
}

export = Autocompletion;
