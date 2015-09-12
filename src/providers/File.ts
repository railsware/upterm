import * as i from '../Interfaces';
import * as _ from 'lodash';
import Utils from '../Utils';
import * as Path from 'path';
import Prompt from "../Prompt";
var score: (i: string, m: string) => number = require('fuzzaldrin').score;

export default class File implements i.AutocompletionProvider {
    getSuggestions(prompt: Prompt) {
        return new Promise((resolve) => {
            if (prompt.getWholeCommand().length < 2) {
                return resolve([]);
            }

            var lastArgument = prompt.getLastArgument();
            var baseName = Utils.baseName(lastArgument);
            var dirName = Utils.dirName(lastArgument);

            if (Path.isAbsolute(lastArgument)) {
                var searchDirectory = dirName;
            } else {
                searchDirectory = Path.join(prompt.getCWD(), dirName);
            }

            Utils.stats(searchDirectory).then((fileInfos) => {
                var all = _.map(fileInfos.filter(File.filter(prompt.getCommandName())), (fileInfo: i.FileInfo) => {

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
                        partial: fileInfo.stat.isDirectory()
                    };

                    if (searchDirectory != prompt.getCWD()) {
                        suggestion.prefix = dirName;
                    }

                    return suggestion;
                });

                if (baseName) {
                    var prepared = _(all).each(fileInfo => fileInfo.score = score(fileInfo.value, baseName))
                                         .sortBy('score').reverse().take(10).value();
                } else {
                    prepared = _(all).each(fileInfo => fileInfo.score = 1).take(30).value();
                }


                resolve(prepared);
            });
        });
    }

    static filter(command: string): (value: i.FileInfo, index: number, array: i.FileInfo[]) => boolean {
        switch (command) {
            case 'cd':
                return (fileInfo: i.FileInfo) => fileInfo.stat.isDirectory();
            default:
                return (fileInfo: i.FileInfo) => true;
        }
    }
}
