/// <reference path="references.ts" />

module BlackScreen {
    // A class representing built in commands
    export class Command {
        static cd(currentDirectory: string, arguments: Array<string>): string {
            if (!arguments.length) {
                return process.env.HOME;
            }

            var path = arguments[0];
            var tokens: [string] = path.split('/');
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
                    var parts: [string] = currentDirectory.split('/');
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
                return newDirectory;
            }
        }

        static isBuiltIn(command: String): any {
            return command == 'cd';
        }
    }
}
