import fs = require('fs');
import Path = require('path');

// A class representing built in commands
class Command {
    static cd(currentDirectory: string, args: Array<string>): string {
        if (!args.length) {
            return process.env.HOME;
        }
        var path = args[0].replace(/^~/, process.env.HOME);
        var newDirectory = Path.resolve(currentDirectory, path);

        if (!fs.existsSync(newDirectory)) {
            throw new Error(`The directory ${newDirectory} doesn't exist.`);
        }

        if (!fs.statSync(newDirectory).isDirectory()) {
            throw new Error(`${newDirectory} is not a directory.`);
        }

        return newDirectory;
    }

    static isBuiltIn(command: String): any {
        return command == 'cd';
    }
}

export = Command;
