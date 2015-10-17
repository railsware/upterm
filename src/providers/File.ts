import * as i from '../Interfaces';
import * as _ from 'lodash';
import Utils from '../Utils';
import * as Path from 'path';
import Prompt from "../Prompt";
var score: (i: string, m: string) => number = require('fuzzaldrin').score;

export default class File implements i.AutocompletionProvider {
    async getSuggestions(prompt: Prompt) {
        if (prompt.commandWithArguments.length < 2) {
            return [];
        }

        var lastArgument = prompt.lastArgument;
        var baseName = Utils.baseName(lastArgument);
        var dirName = Utils.dirName(lastArgument);

        if (Path.isAbsolute(lastArgument)) {
            var searchDirectory = dirName;
        } else {
            searchDirectory = Path.join(prompt.getCWD(), dirName);
        }

        let fileInfos = await Utils.stats(searchDirectory);

        var all = _.map(fileInfos.filter(File.filter(prompt.commandName)), (fileInfo: i.FileInfo): i.Suggestion => {

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

            if (searchDirectory !== prompt.getCWD()) {
                suggestion.prefix = dirName;
            }

            return suggestion;
        });

        if (baseName) {
            var prepared = _._(all).each(suggestion => suggestion.score = score(suggestion.value, baseName))
                .sortBy('score').reverse().take(10).value();
        } else {
            prepared = _._(all).each(suggestion => suggestion.score = 1).take(30).value();
        }

        return prepared;
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
