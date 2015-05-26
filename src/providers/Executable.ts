import Utils = require('../Utils');
import i = require('../Interfaces');
import _ = require('lodash')
var Fuse: any = require('fuse.js');

class Executable implements i.AutocompletionProvider {
    private paths: Array<string> = process.env.PATH.split(':');
    private executables: string[] = [];

    constructor() {
        this.paths.forEach((path) => {
            Utils.filesIn(path, (files) => {
                var executableNames = files.map((fileName) => {
                    return fileName.split('/').pop();
                });

                this.executables = this.executables.concat(executableNames);
            })
        });
    }

    getSuggestions(currentDirectory: string, input: i.Parsable) {
        return new Promise((resolve) => {
            if (input.getLexemes().length > 1) {
                return resolve([]);
            }

            var all = _.map(this.executables, (executable: string) => {
                return {
                    value: executable,
                    priority: 0,
                    synopsis: '',
                    description: '',
                    type: 'executable'
                };
            });

            var fuse = new Fuse(all, {keys: ['value', 'synopsis']});

            var result = fuse.search(input.getLastLexeme());
            resolve(result);
        });
    }
}

export = Executable;
