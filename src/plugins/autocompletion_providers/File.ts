import * as i from "../../Interfaces";
import * as _ from "lodash";
import Utils from "../../Utils";
import Autocompletion from "../../Autocompletion";
import PluginManager from "../../PluginManager";
const score: (i: string, m: string) => number = require("fuzzaldrin").score;

function filter(command: string): (value: i.FileInfo, index: number, array: i.FileInfo[]) => boolean {
    switch (command) {
        case "cd":
            return (fileInfo: i.FileInfo) => fileInfo.stat.isDirectory();
        default:
            return (fileInfo: i.FileInfo) => true;
    }
}

function escape(path: string): string {
    return path.replace(/\s/g, "\\ ");
}

PluginManager.registerAutocompletionProvider({
    getSuggestions: async (job): Promise<i.Suggestion[]> => {
        const prompt = job.prompt;

        if (prompt.expanded.length < 2) {
            return [];
        }

        const lastArgument = prompt.lastArgument;
        const baseName = Utils.baseName(lastArgument);
        const dirName = Utils.dirName(lastArgument);
        const searchDirectory = Utils.resolveDirectory(job.directory, dirName);
        const fileInfos = await Utils.stats(searchDirectory);

        const all = _.map(fileInfos.filter(filter(prompt.commandName)), (fileInfo: i.FileInfo): i.Suggestion => {
            /* tslint:disable:no-bitwise */
            let description = `Mode: ${"0" + (fileInfo.stat.mode & 511).toString(8)}`;
            let name: string;

            if (fileInfo.stat.isDirectory()) {
                name = Utils.normalizeDir(fileInfo.name);
            } else {
                name = fileInfo.name;
                description += `; Size: ${Utils.humanFileSize(fileInfo.stat.size)}`;
            }

            const suggestion: i.Suggestion = {
                value: escape(name),
                score: 0,
                synopsis: "",
                description: description,
                type: "file",
                partial: fileInfo.stat.isDirectory(),
            };

            if (searchDirectory !== job.directory) {
                suggestion.prefix = escape(dirName);
            }

            return suggestion;
        });

        let prepared: i.Suggestion[];
        if (baseName) {
            prepared = _._(all).each(suggestion => suggestion.score = score(suggestion.value, baseName))
                .sortBy("score").reverse().take(10).value();
        } else {
            prepared = _._(all).each(suggestion => suggestion.score = 1).take(Autocompletion.limit).value();
        }

        return prepared;
    },
});
