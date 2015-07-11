import i = require('../Interfaces');
import _ = require('lodash');
import Utils = require('../Utils');
import Path = require('path');
var score: (i: string, m: string) => number = require('fuzzaldrin').score;

class File implements i.AutocompletionProvider {
    getSuggestions(currentDirectory: string, input: i.Parsable) {
        return new Promise((resolve) => {
            if (input.getLexemes().length < 2) {
                return resolve([]);
            }
            var baseName = Path.basename(input.getLastLexeme());
            var enteredDirectoriesPath = Utils.normalizeDir(Path.dirname(input.getLastLexeme()));

            if (Path.isAbsolute(enteredDirectoriesPath)) {
                var searchDirectory = enteredDirectoriesPath;
            } else {
                searchDirectory = Utils.normalizeDir(Path.join(currentDirectory, enteredDirectoriesPath));
            }

            Utils.stats(searchDirectory).then((fileInfos) => {
                var all = _.map(fileInfos, (fileInfo: i.FileInfo) => {
                    let name = fileInfo.name;

                    if (fileInfo.stat.isDirectory()) {
                        name = Utils.normalizeDir(name);
                    }

                    var suggestion: i.Suggestion = {
                        value: name,
                        score: score(name, input.getLastLexeme()) || score(name, baseName),
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

                resolve(_(all).sortBy('score').reverse().take(10).value());
            });
        });
    }
}

export = File;
