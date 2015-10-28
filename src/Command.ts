import * as _ from 'lodash';
import * as fs from 'fs';
import * as Path from 'path';
import Utils from './Utils';
import Invocation from "./Invocation";

const executors: _.Dictionary<(i: Invocation, a: string[]) => void> = {
    cd: (invocation: Invocation, args: string[]): void => {
        var newDirectory: string;

        if (!args.length) {
            newDirectory = Utils.homeDirectory;
        } else {
            var path = args[0].replace(/^~/, Utils.homeDirectory);
            newDirectory = Path.resolve(invocation.directory, path);

            if (!fs.existsSync(newDirectory)) {
                throw new Error(`The directory ${newDirectory} doesn't exist.`);
            }

            if (!fs.statSync(newDirectory).isDirectory()) {
                throw new Error(`${newDirectory} is not a directory.`);
            }
        }

        invocation.terminal.currentDirectory = newDirectory;
    },
    clear: (invocation: Invocation, args: string[]): void => {
        setTimeout(() => invocation.terminal.clearInvocations(), 0);
    }
};

// A class representing built in commands
export default class Command {

    static executor(command: string): (i: Invocation, args: string[]) => void {
        return executors[command];
    }

    static isBuiltIn(command: string): any {
        return _.include(['cd', 'clear'], command);
    }
}
