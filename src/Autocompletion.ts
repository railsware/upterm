import Executable = require('./providers/Executable');
import Command = require('./providers/Command');
import File = require('./providers/File');
import Alias = require('./providers/Alias');
import History = require('./providers/History');
import _ = require('lodash');
import i = require('./Interfaces');
import Prompt = require("./Prompt");

class Autocompletion implements i.AutocompletionProvider {
    providers = [new Command(), new Alias(), new Executable(), new File(), new History()];
    limit = 30;

    getSuggestions(prompt: Prompt) {
        return Promise.all(_.map(this.providers, provider => provider.getSuggestions(prompt))).then(results =>
            _(results)
                .flatten()
                .select((suggestion: i.Suggestion) => suggestion.score > 0)
                .sortBy((suggestion: i.Suggestion) => -suggestion.score)
                .uniq('value')
                .take(this.limit)
                .value()
        );
    }
}

export = Autocompletion;
