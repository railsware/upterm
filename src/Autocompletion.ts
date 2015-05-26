import Executable = require('./providers/Executable');
import Command = require('./providers/Command');
import File = require('./providers/File');
import Alias = require('./providers/Alias');
import History = require('./providers/History');
import _ = require('lodash');
import i = require('./Interfaces');

class Autocompletion implements i.AutocompletionProvider {
    providers = [new Command(), new Alias(), new Executable(), new File(), new History()];
    limit = 30;

    getSuggestions(currentDirectory: string, input: i.Parsable) {
        return Promise.all(_.map(this.providers, (provider) => {
            return provider.getSuggestions(currentDirectory, input);
        })).then((results) => {
            return _(results).flatten().sortBy('score').map('item').uniq('value').take(this.limit).value();
        });
    }
}

export = Autocompletion;
