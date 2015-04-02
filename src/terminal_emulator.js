var pty = require('pty.js');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

function TerminalEmulator() {
    EventEmitter.call(this);
    this.currentDirectory = process.env.HOME;
}

TerminalEmulator.prototype.execute = function (command) {
    var parts = command.split(/\s+/);

    var commandName = parts.shift();
    var args = parts;

    if (commandName === 'cd') {
        this.currentDirectory = args[0];
        this.emit('end');
    } else {
        var child = pty.spawn(commandName, args, {
            cols: 80,
            rows: 30,
            cwd: this.currentDirectory,
            env: process.env
        });

        ['data', 'end'].forEach(function(eventName) {
            child.on(eventName, this.emit.bind(null, eventName));
        }, this);
    }
};

util.inherits(TerminalEmulator, EventEmitter);

module.exports = TerminalEmulator;
