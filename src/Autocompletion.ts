import Executable = require('./providers/Executable');
import File = require('./providers/File');
import Alias = require('./providers/Alias');
import _ = require('lodash');
import i = require('./Interfaces');

class Autocompletion implements i.AutocompletionProvider {
    executableCompletions: Executable;
    fileCompletion: File;
    aliasCompletion: Alias;

    constructor() {
        this.executableCompletions = new Executable();
        this.fileCompletion = new File();
        this.aliasCompletion = new Alias();
    }

    getSuggestions(currentDirectory: string, input: string, callback: (suggestions: string[]) => void) {
        //TODO: flatten.
        this.executableCompletions.getSuggestions(currentDirectory, input, (executables) => {
            this.fileCompletion.getSuggestions(currentDirectory, input, (files) => {
                this.aliasCompletion.getSuggestions(currentDirectory, input, (aliases) => {
                    callback(aliases.concat(executables.concat(files)));
                });
            });
        });
    }
}

export = Autocompletion;
