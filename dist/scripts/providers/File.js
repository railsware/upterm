var _ = require('lodash');
var Utils_1 = require('../Utils');
var Path = require('path');
var score = require('fuzzaldrin').score;
var File = (function () {
    function File() {
    }
    File.prototype.getSuggestions = function (prompt) {
        return new Promise(function (resolve) {
            if (prompt.getWholeCommand().length < 2) {
                return resolve([]);
            }
            var lastArgument = prompt.getLastArgument();
            var baseName = Utils_1.default.baseName(lastArgument);
            var dirName = Utils_1.default.dirName(lastArgument);
            if (Path.isAbsolute(lastArgument)) {
                var searchDirectory = dirName;
            }
            else {
                searchDirectory = Path.join(prompt.getCWD(), dirName);
            }
            Utils_1.default.stats(searchDirectory).then(function (fileInfos) {
                var all = _.map(fileInfos.filter(File.filter(prompt.getCommandName())), function (fileInfo) {
                    if (fileInfo.stat.isDirectory()) {
                        var name = Utils_1.default.normalizeDir(fileInfo.name);
                        var synopsis = '';
                    }
                    else {
                        name = fileInfo.name;
                        synopsis = Utils_1.default.humanFileSize(fileInfo.stat.size, true);
                    }
                    var suggestion = {
                        value: name,
                        score: 0,
                        synopsis: synopsis,
                        description: '',
                        type: 'file',
                        partial: fileInfo.stat.isDirectory()
                    };
                    if (searchDirectory !== prompt.getCWD()) {
                        suggestion.prefix = dirName;
                    }
                    return suggestion;
                });
                if (baseName) {
                    var prepared = _(all).each(function (fileInfo) { return fileInfo.score = score(fileInfo.value, baseName); })
                        .sortBy('score').reverse().take(10).value();
                }
                else {
                    prepared = _(all).each(function (fileInfo) { return fileInfo.score = 1; }).take(30).value();
                }
                resolve(prepared);
            });
        });
    };
    File.filter = function (command) {
        switch (command) {
            case 'cd':
                return function (fileInfo) { return fileInfo.stat.isDirectory(); };
            default:
                return function (fileInfo) { return true; };
        }
    };
    return File;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = File;
