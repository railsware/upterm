import i = require('../Interfaces');
import _ = require('lodash');
import Utils = require('../Utils');
var filter: any = require('fuzzaldrin').filter;

class File implements i.AutocompletionProvider {
    getSuggestions(currentDirectory: string, input: i.Parsable) {
        return new Promise((resolve) => {
            if (input.getLexemes().length < 2) {
                return resolve([]);
            }

            Utils.stats(currentDirectory).then((fileInfos) => {
                var all = _.map(fileInfos, (fileInfo: i.FileInfo) => {
                    return {
                        value: fileInfo.name,
                        score: 0,
                        synopsis: '',
                        description: '',
                        type: 'file',
                        partial: fileInfo.stat.isDirectory()
                    };
                });

                resolve(filter(all, input.getLastLexeme(), {key: 'value', maxResults: 30}));
            });
        });
    }
}

export = File;
