import fs = require('fs');

// A class representing built in commands
class Command {
    static cd(currentDirectory: string, args: Array<string>): string {
        if (!args.length) {
            return process.env.HOME;
        }

        var path = args[0];
        //FIXME: doesn't work correctly for 'cd /'.
        var tokens: Array<string> = path.split('/');
        var firstToken = tokens.shift();

        var newDirectory = currentDirectory;

        switch (firstToken) {
            case '~':
                newDirectory = process.env.HOME;
                break;
            case '/':
                newDirectory = '/';
                break;
            case '..':
                var parts: Array<string> = currentDirectory.split('/');
                newDirectory = parts.slice(0, parts.length - 1).join('/');
                break;
            case '.':
                break;
            default:
                newDirectory += `/${firstToken}`;
        }

        if (tokens.length) {
            return this.cd(newDirectory, [tokens.join('/')]);
        } else {
            if (!fs.existsSync(newDirectory)) {
                throw new Error(`The directory ${newDirectory} doesn't exist.`);
            }

            if (!fs.statSync(newDirectory).isDirectory()) {
                throw new Error(`${newDirectory} is not a directory.`);
            }

            return newDirectory;
        }
    }

    static isBuiltIn(command: String): any {
        return command == 'cd';
    }
}

export = Command;
