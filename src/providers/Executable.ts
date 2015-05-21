import Utils = require('../Utils');
import i = require('../Interfaces');
import _ = require('lodash')


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

    getSuggestions(currentDirectory: string, input: string) {
        return new Promise((resolve) => {
            var filtered = _.filter(this.executables, (executable: string) => {
                return executable.startsWith(input);
            });

            resolve(_.map(filtered, (executable: string) => {
                return {
                    value: executable,
                    priority: 0,
                    synopsis: '',
                    description: '',
                    type: 'executable'
                };
            }));
        });
    }
}

export = Executable;
