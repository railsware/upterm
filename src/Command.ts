/// <reference path="references.ts" />

module BlackScreen {
    // A class representing built in commands
    export class Command {
        static cd(currentDirectory: string, arguments: Array<string>): string {
            var path = arguments[0];
            if (!path) {
                return process.env.HOME;
            } else if (path[0] == '~') {
                return process.env.HOME + path.slice(1);
            } else if (/^\.\./.test(path)) {
                var pathParts = path.split('/');
                pathParts.shift();
                var parts = currentDirectory.split('/');
                var newDirectory = parts.slice(0, parts.length - 1).join('/');

                if (pathParts.length) {
                    return this.cd(newDirectory, [pathParts.join('/')]);
                } else {
                    return newDirectory;
                }
            } else if (path == '.') {
                return currentDirectory;
            } else if (path[0] == '/') {
                return path;
            } else {
                return `${currentDirectory}/${path}`;
            }
        }
    }
}
