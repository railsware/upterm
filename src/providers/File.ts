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

            var lastLexeme = input.getLastLexeme();
            var baseName = Utils.baseName(lastLexeme);
            var dirName = Utils.dirName(lastLexeme);

            if (Path.isAbsolute(lastLexeme)) {
                var searchDirectory = dirName;
            } else {
                searchDirectory = Path.join(currentDirectory, dirName);
            }

            Utils.stats(searchDirectory).then((fileInfos) => {
                var all = _.map(fileInfos, (fileInfo: i.FileInfo) => {

                    if (fileInfo.stat.isDirectory()) {
                        var name: string = Utils.normalizeDir(fileInfo.name);
                        var synopsis = '';
                    } else {
                        name = fileInfo.name;
                        synopsis = Utils.humanFileSize(fileInfo.stat.size, true);
                    }

                    var suggestion: i.Suggestion = {
                        value: name,
                        score: 0,
                        synopsis: synopsis,
                        description: '',
                        type: 'file',
                        partial: fileInfo.stat.isDirectory(),
                    };

                    if (searchDirectory != currentDirectory) {
                        suggestion.prefix = dirName;
                    }

                    return suggestion;
                });

                if (baseName) {
                    var prepared = _(all).each((fileInfo) => { fileInfo.score = score(fileInfo.value, baseName) })
                                         .sortBy('score').reverse().take(10).value();
                } else {
                    prepared = _(all).each((fileInfo) => { fileInfo.score = 1; }).take(30).value();
                }


                resolve(prepared);
            });
        });
    }
}

export = File;
