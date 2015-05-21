import Executable = require('./providers/Executable');
import File = require('./providers/File');
import Alias = require('./providers/Alias');
import History = require('./providers/History');
import _ = require('lodash');
import i = require('./Interfaces');

class Autocompletion implements i.AutocompletionProvider {
    providers = [new Alias(), new Executable(), new File(), new History()];

    getSuggestions(currentDirectory: string, input: string) {
        return Promise.all(_.map(this.providers, (provider) => {
            return provider.getSuggestions(currentDirectory, input);
        })).then((results) => {
            return _(results).flatten().uniq('value').take(30).value();
        });
    }
}

export = Autocompletion;
