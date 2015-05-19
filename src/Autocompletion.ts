import Executable = require('./providers/Executable');
import File = require('./providers/File');
import Alias = require('./providers/Alias');
import History = require('./providers/History');
import _ = require('lodash');
import i = require('./Interfaces');

class Autocompletion implements i.AutocompletionProvider {
    type = 'autocompletion';

    executableCompletions: Executable;
    fileCompletion: File;
    aliasCompletion: Alias;
    historyCompletion: History;

    constructor() {
        this.executableCompletions = new Executable();
        this.fileCompletion = new File();
        this.aliasCompletion = new Alias();
        this.historyCompletion = new History();
    }

    getSuggestions(currentDirectory: string, input: string, callback: (suggestions: i.TypedSuggestion[]) => void) {
        //TODO: flatten.
        this.executableCompletions.getSuggestions(currentDirectory, input, (executables) => {
            this.fileCompletion.getSuggestions(currentDirectory, input, (files) => {
                this.aliasCompletion.getSuggestions(currentDirectory, input, (aliases) => {
                    this.historyCompletion.getSuggestions(currentDirectory, input, (history) => {
                        var e = Autocompletion.typeSuggestions(this.executableCompletions.type, executables);
                        var f = Autocompletion.typeSuggestions(this.fileCompletion.type, files);
                        var a = Autocompletion.typeSuggestions(this.aliasCompletion.type, aliases);
                        var h = Autocompletion.typeSuggestions(this.historyCompletion.type, history);

                        callback(a.concat(e.concat(f.concat(h))));
                    });
                });
            });
        });
    }

    private static typeSuggestions(type: string, suggestions: i.Suggestion[]): i.TypedSuggestion[] {
        return _.map(suggestions, (suggestion) => {
            return <i.TypedSuggestion>_.merge(suggestion, { type: type });
        });
    }
}

export = Autocompletion;
