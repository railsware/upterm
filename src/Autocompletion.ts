import Executable = require('./providers/Executable');
import File = require('./providers/File');
import Alias = require('./providers/Alias');
import History = require('./providers/History');
import _ = require('lodash');
import i = require('./Interfaces');

class Autocompletion implements i.AutocompletionProvider {
    providers = [new Alias(), new Executable(), new File(), new History()];

    getSuggestions(currentDirectory: string, input: string) {
        return new Promise((resolve) => {
            Promise.all(_.map(this.providers, (provider) => {
                return provider.getSuggestions(currentDirectory, input);
            })).then((results) => {
                resolve(_.uniq(_.flatten(results), 'value').slice(0, 30));
            });
        });
    }
}

export = Autocompletion;
