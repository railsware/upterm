import * as i from '../../Interfaces';
import * as _ from 'lodash';
import Utils from '../../Utils';
import * as Path from 'path';
import Job from "../../Job";
import Autocompletion from "../../Autocompletion";
import PluginManager from "../../PluginManager";
var score: (i: string, m: string) => number = require('fuzzaldrin').score;

class File implements i.AutocompletionProvider {
    async getSuggestions(job: Job) {
        const prompt = job.getPrompt();

        if (prompt.expanded.length < 2) {
            return [];
        }

        var lastArgument = prompt.lastArgument;
        var baseName = Utils.baseName(lastArgument);
        var dirName = Utils.dirName(lastArgument);

        if (Path.isAbsolute(lastArgument)) {
            var searchDirectory = dirName;
        } else {
            searchDirectory = Path.join(job.directory, dirName);
        }

        let fileInfos = await Utils.stats(searchDirectory);

        var all = _.map(fileInfos.filter(File.filter(prompt.commandName)), (fileInfo: i.FileInfo): Suggestion => {
            var description = `Mode: ${'0' + (fileInfo.stat.mode & 511).toString(8)}`;
            if (fileInfo.stat.isDirectory()) {
                var name: string = Utils.normalizeDir(fileInfo.name);
            } else {
                name = fileInfo.name;
                description += `; Size: ${Utils.humanFileSize(fileInfo.stat.size)}`;
            }

            var suggestion: Suggestion = {
                value: name,
                score: 0,
                synopsis: '',
                description: description,
                type: 'file',
                partial: fileInfo.stat.isDirectory()
            };

            if (searchDirectory !== job.directory) {
                suggestion.prefix = dirName;
            }

            return suggestion;
        });

        if (baseName) {
            var prepared = _._(all).each(suggestion => suggestion.score = score(suggestion.value, baseName))
                .sortBy('score').reverse().take(10).value();
        } else {
            prepared = _._(all).each(suggestion => suggestion.score = 1).take(Autocompletion.limit).value();
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

PluginManager.registerAutocompletionProvider(new File());
