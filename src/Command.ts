import * as fs from 'fs';
import * as Path from 'path';
import Utils from './Utils';

// A class representing built in commands
export default class Command {
    static cd(currentDirectory: string, args: Array<string>): string {
        if (!args.length) {
            return Utils.homeDirectory;
        }
        var path = args[0].replace(/^~/, Utils.homeDirectory);
        var newDirectory = Path.resolve(currentDirectory, path);

        if (!fs.existsSync(newDirectory)) {
            throw new Error(`The directory ${newDirectory} doesn't exist.`);
        }

        if (!fs.statSync(newDirectory).isDirectory()) {
            throw new Error(`${newDirectory} is not a directory.`);
        }

        return newDirectory;
    }

    static clear(): void {

    }

    static isBuiltIn(command: string): any {
        return command === 'cd';
    }
}
