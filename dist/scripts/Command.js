var fs = require('fs');
var Path = require('path');
var Utils_1 = require('./Utils');
var Command = (function () {
    function Command() {
    }
    Command.cd = function (currentDirectory, args) {
        if (!args.length) {
            return Utils_1.default.homeDirectory;
        }
        var path = args[0].replace(/^~/, Utils_1.default.homeDirectory);
        var newDirectory = Path.resolve(currentDirectory, path);
        if (!fs.existsSync(newDirectory)) {
            throw new Error("The directory " + newDirectory + " doesn't exist.");
        }
        if (!fs.statSync(newDirectory).isDirectory()) {
            throw new Error(newDirectory + " is not a directory.");
        }
        return newDirectory;
    };
    Command.isBuiltIn = function (command) {
        return command === 'cd';
    };
    return Command;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Command;
