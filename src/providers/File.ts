import i = require('../Interfaces');
import _ = require('lodash');
import Utils = require('../Utils');
var Fuse: any = require('fuse.js');

class File implements i.AutocompletionProvider {
    getSuggestions(currentDirectory: string, input: i.Parsable) {
        return new Promise((resolve) => {
            Utils.filesIn(currentDirectory, (files) => {
                if (input.getLexemes().length < 2) {
                    return resolve([]);
                }

                var all = _.map(files, (fileName: string) => {
                    return {
                        value: fileName,
                        priority: 0,
                        synopsis: '',
                        description: '',
                        type: 'file'
                    };
                });

                var fuse = new Fuse(all, {keys: ['value', 'synopsis'], includeScore: true});

                var result = fuse.search(input.getLastLexeme());
                resolve(result);
            });
        });
    }
}

export = File;
