var pty = require('pty.js');
var util = require('util');
var History = require('./history');
var EventEmitter = require('events').EventEmitter;

function Shell() {
    EventEmitter.call(this);
    this.currentDirectory = process.env.HOME;
    this.history = new History();

    this.columns = 120;
    this.rows = 40;
}

util.inherits(Shell, EventEmitter);

Shell.prototype.execute = function (command) {
    this.history.append(command);

    var parts = command.split(/\s+/);

    var commandName = parts.shift();
    var args = parts;

    if (commandName === 'cd') {
        this.currentDirectory = args[0];
        this.emit('end');
    } else {
        var child = pty.spawn(commandName, args, {
            cols: this.columns,
            rows: this.rows,
            cwd: this.currentDirectory,
            env: process.env
        });

        this.currentCommand = child;

        child.on('data', this.emit.bind(this, 'data'));

        child.on('end', function () {
            this.emit('end');
            this.currentCommand = null;
        }.bind(this, 'end'));
    }
};

Shell.prototype.resize = function (dimensions) {
    this.columns = dimensions.columns;
    this.rows = dimensions.rows;

    if (this.currentCommand) {
        this.currentCommand.kill('SIGWINCH');
    }
};

module.exports = Shell;
