var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Command_1 = require("./Command");
var Utils_1 = require('./Utils');
var pty = require('ptyw.js');
var _ = require('lodash');
var CommandExecutionStrategy = (function () {
    function CommandExecutionStrategy(invocation, command) {
        this.invocation = invocation;
        this.command = command;
        this.args = invocation.getPrompt().getArguments().filter(function (argument) { return argument.length > 0; });
    }
    CommandExecutionStrategy.canExecute = function (command) {
        return new Promise(function (resolve) { return resolve(false); });
    };
    return CommandExecutionStrategy;
})();
var BuiltInCommandExecutionStrategy = (function (_super) {
    __extends(BuiltInCommandExecutionStrategy, _super);
    function BuiltInCommandExecutionStrategy() {
        _super.apply(this, arguments);
    }
    BuiltInCommandExecutionStrategy.canExecute = function (command) {
        return new Promise(function (resolve) { return resolve(Command_1.default.isBuiltIn(command)); });
    };
    BuiltInCommandExecutionStrategy.prototype.startExecution = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                var newDirectory = Command_1.default.cd(_this.invocation.directory, _this.args);
                _this.invocation.emit('working-directory-changed', newDirectory);
                resolve();
            }
            catch (error) {
                reject(error.message);
            }
        });
    };
    return BuiltInCommandExecutionStrategy;
})(CommandExecutionStrategy);
var UnixSystemFileExecutionStrategy = (function (_super) {
    __extends(UnixSystemFileExecutionStrategy, _super);
    function UnixSystemFileExecutionStrategy() {
        _super.apply(this, arguments);
    }
    UnixSystemFileExecutionStrategy.canExecute = function (command) {
        return new Promise(function (resolve) { return Utils_1.default.getExecutablesInPaths().then(function (executables) { return resolve(_.include(executables, command)); }); });
    };
    UnixSystemFileExecutionStrategy.prototype.startExecution = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.invocation.command = pty.spawn(process.env.SHELL, ['-c', (_this.command + " " + _this.args.join(' '))], {
                cols: _this.invocation.dimensions.columns,
                rows: _this.invocation.dimensions.rows,
                cwd: _this.invocation.directory,
                env: process.env
            });
            _this.invocation.command.stdout.on('data', function (data) { return _this.invocation.parser.parse(data.toString()); });
            _this.invocation.command.on('exit', function (code) {
                if (code === 0) {
                    resolve();
                }
                else {
                    reject();
                }
            });
        });
    };
    return UnixSystemFileExecutionStrategy;
})(CommandExecutionStrategy);
var WindowsSystemFileExecutionStrategy = (function (_super) {
    __extends(WindowsSystemFileExecutionStrategy, _super);
    function WindowsSystemFileExecutionStrategy() {
        _super.apply(this, arguments);
    }
    WindowsSystemFileExecutionStrategy.canExecute = function (command) {
        return new Promise(function (resolve) { return resolve(Utils_1.default.isWindows); });
    };
    WindowsSystemFileExecutionStrategy.prototype.startExecution = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.invocation.command = pty.spawn(_this.cmdPath, ['/s', '/c', _this.invocation.getPrompt().getWholeCommand().join(' ')], {
                cols: _this.invocation.dimensions.columns,
                rows: _this.invocation.dimensions.rows,
                cwd: _this.invocation.directory,
                env: process.env
            });
            _this.invocation.command.stdout.on('data', function (data) { return _this.invocation.parser.parse(data.toString()); });
            _this.invocation.command.on('exit', function (code) { return resolve(); });
        });
    };
    Object.defineProperty(WindowsSystemFileExecutionStrategy.prototype, "cmdPath", {
        get: function () {
            if (process.env.comspec) {
                return process.env.comspec;
            }
            else if (process.env.SystemRoot) {
                return require('path').join(process.env.SystemRoot, 'System32', 'cmd.exe');
            }
            else
                return 'cmd.exe';
        },
        enumerable: true,
        configurable: true
    });
    return WindowsSystemFileExecutionStrategy;
})(CommandExecutionStrategy);
var NullExecutionStrategy = (function (_super) {
    __extends(NullExecutionStrategy, _super);
    function NullExecutionStrategy() {
        _super.apply(this, arguments);
    }
    NullExecutionStrategy.canExecute = function (command) {
        return new Promise(function (resolve) { return resolve(true); });
    };
    NullExecutionStrategy.prototype.startExecution = function () {
        var _this = this;
        return new Promise(function (resolve, reject) { return reject("Black Screen: command \"" + _this.command + "\" not found."); });
    };
    return NullExecutionStrategy;
})(CommandExecutionStrategy);
var CommandExecutor = (function () {
    function CommandExecutor() {
    }
    CommandExecutor.execute = function (invocation) {
        var command = invocation.getPrompt().getCommandName();
        return Utils_1.default.filterWithPromising(this.executors.concat(NullExecutionStrategy), function (executor) { return executor.canExecute(command); })
            .then(function (applicableExecutors) { return new applicableExecutors[0](invocation, command).startExecution(); });
    };
    CommandExecutor.executors = [
        BuiltInCommandExecutionStrategy,
        WindowsSystemFileExecutionStrategy,
        UnixSystemFileExecutionStrategy
    ];
    return CommandExecutor;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CommandExecutor;
