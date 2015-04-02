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

        ['data', 'end'].forEach(function (eventName) {
            child.on(eventName, this.emit.bind(this, eventName));
        }, this);
    }
};

Shell.prototype.resize = function (dimensions) {
    this.columns = dimensions.columns;
    this.rows = dimensions.rows;
};

module.exports = Shell;
