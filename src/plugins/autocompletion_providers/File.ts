import Utils from "../../Utils";
import PluginManager from "../../PluginManager";
import {File} from "./Suggestions";
import {FileInfo} from "../../Interfaces";

// FIXME: make a generic file completion provider with ability to filter the results.
function filter(command: string): (value: FileInfo, index: number, array: FileInfo[]) => boolean {
    switch (command) {
        case "cd":
            return (fileInfo: FileInfo) => fileInfo.stat.isDirectory();
        default:
            return (fileInfo: FileInfo) => true;
    }
}

PluginManager.registerAutocompletionProvider({
    getSuggestions: async function(job) {
        const prompt = job.prompt;

        if (!prompt.arguments.length) {
            return [];
        }

        const relativeSearchDirectory = Utils.dirName(prompt.lastArgument);
        const fileInfos = await Utils.stats(Utils.resolveDirectory(job.directory, relativeSearchDirectory));

        return fileInfos.filter(filter(prompt.commandName)).map(fileInfo => {
            return new File(fileInfo, relativeSearchDirectory);
        });
    },
});
