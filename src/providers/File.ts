import i = require('../Interfaces');
import _ = require('lodash');
import Utils = require('../Utils');
import Path = require('path');
var filter: any = require('fuzzaldrin').filter;

class File implements i.AutocompletionProvider {
    getSuggestions(currentDirectory: string, input: i.Parsable) {
        return new Promise((resolve) => {
            if (input.getLexemes().length < 2) {
                return resolve([]);
            }

            var enteredDirectoriesPath = Utils.normalizeDir(Path.dirname(input.getLastLexeme()));
            var searchDirectory = Utils.normalizeDir(Path.join(currentDirectory, enteredDirectoriesPath));

            Utils.stats(searchDirectory).then((fileInfos) => {
                var all = _.map(fileInfos, (fileInfo: i.FileInfo) => {
                    let name = fileInfo.name;

                    if (fileInfo.stat.isDirectory()) {
                        name = Utils.normalizeDir(name);
                    }

                    var suggestion: i.Suggestion = {
                        value: name,
                        score: 0,
                        synopsis: '',
                        description: '',
                        type: 'file',
                        partial: fileInfo.stat.isDirectory(),
                    };

                    if (searchDirectory != currentDirectory) {
                        suggestion.prefix = enteredDirectoriesPath;
                    }

                    return suggestion;
                });

                resolve(filter(all, Path.basename(input.getLastLexeme()), {key: 'value', maxResults: 30}));
            });
        });
    }
}

export = File;
