var fs = require('fs');
var Path = require('path');
var _ = require('lodash');
var Utils = (function () {
    function Utils() {
    }
    Utils.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        this.delegate('log', args);
    };
    Utils.info = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        this.delegate('info', args);
    };
    Utils.debug = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        this.delegate('debug', args);
    };
    Utils.error = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        this.delegate('error', args);
    };
    Utils.filesIn = function (directory) {
        return new Promise(function (resolve, reject) {
            Utils.ifExists(directory, function () {
                fs.stat(directory, function (error, pathStat) {
                    if (!pathStat.isDirectory()) {
                        reject(directory + " is not a directory.");
                    }
                    fs.readdir(directory, function (error, files) {
                        if (error) {
                            reject(error);
                        }
                        resolve(files);
                    });
                });
            });
        });
    };
    Utils.stats = function (directory) {
        return Utils.filesIn(directory).then(function (files) {
            return Promise.all(files.map(function (fileName) {
                return new Promise(function (resolve, reject) {
                    return fs.stat(Path.join(directory, fileName), function (error, stat) {
                        if (error) {
                            reject(error);
                        }
                        resolve({ name: fileName, stat: stat });
                    });
                });
            }));
        });
    };
    Utils.ifExists = function (fileName, callback, elseCallback) {
        fs.exists(fileName, function (pathExists) {
            if (pathExists) {
                callback();
            }
            else if (elseCallback) {
                elseCallback();
            }
        });
    };
    Utils.isDirectory = function (directoryName) {
        return new Promise(function (resolve) {
            Utils.ifExists(directoryName, function () {
                fs.stat(directoryName, function (error, pathStat) {
                    resolve(pathStat.isDirectory());
                });
            }, function () { return resolve(false); });
        });
    };
    Utils.normalizeDir = function (path) {
        return Path.normalize(path + Path.sep);
    };
    Utils.dirName = function (path) {
        return this.normalizeDir(path.endsWith(Path.sep) ? path : Path.dirname(path));
    };
    Utils.baseName = function (path) {
        if (path.split(Path.sep).length === 1) {
            return path;
        }
        else {
            return path.substring(this.dirName(path).length);
        }
    };
    Utils.humanFileSize = function (bytes, si) {
        var thresh = si ? 1000 : 1024;
        if (Math.abs(bytes) < thresh) {
            return bytes + 'B';
        }
        var units = si
            ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
            : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
        var u = -1;
        do {
            bytes /= thresh;
            ++u;
        } while (Math.abs(bytes) >= thresh && u < units.length - 1);
        return bytes.toFixed(1) + '' + units[u];
    };
    Utils.getExecutablesInPaths = function () {
        var _this = this;
        return new Promise(function (resolve) {
            if (_this.executables.length) {
                resolve(_this.executables);
            }
            else {
                return _this.filterWithPromising(_this.paths, _this.isDirectory).then(function (paths) {
                    return Promise.all(paths.map(_this.filesIn)).then(function (allFiles) { return resolve(_.uniq(allFiles.reduce(function (acc, files) { return acc.concat(files); }))); });
                });
            }
        });
    };
    Object.defineProperty(Utils, "isWindows", {
        get: function () {
            return process.platform === 'win32';
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Utils, "homeDirectory", {
        get: function () {
            return process.env[(Utils.isWindows) ? 'USERPROFILE' : 'HOME'];
        },
        enumerable: true,
        configurable: true
    });
    Utils.delegate = function (name, args) {
        if ((typeof window !== 'undefined') && window['DEBUG']) {
            (_a = console)[name].apply(_a, args);
        }
        var _a;
    };
    Utils.filterWithPromising = function (values, filter) {
        return new Promise(function (resolve) {
            Promise
                .all(values.map(function (value) { return new Promise(function (rs) { return filter(value).then(rs, function () { return rs(false); }); }); }))
                .then(function (filterResults) { return resolve(_(values).zip(filterResults).filter(function (z) { return z[1]; }).map(function (z) { return z[0]; }).value()); });
        });
    };
    Utils.paths = process.env.PATH.split(Path.delimiter);
    Utils.executables = [];
    return Utils;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Utils;
