import Utils = require('../Utils');
import i = require('../Interfaces');
import _ = require('lodash')
var filter: any = require('fuzzaldrin').filter;

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
                    score: 0.1,
                    synopsis: '',
                    description: '',
                    type: 'executable'
                };
            });

            resolve(filter(all, input.getLastLexeme(), {key: 'value', maxResults: 30}));
        });
    }
}

export = Executable;
