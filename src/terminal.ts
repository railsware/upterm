/// <reference path="../dts/black_screen.d.ts" />

import $ = require('jquery');
import lodash = require('lodash');
var pty = require('pty.js');
import events = require('events');

module BlackScreen {
    interface Dimensions {
        columns:number;
        rows:number;
    }

    class Shell extends events.EventEmitter {
        currentDirectory:string;
        currentCommand:any;
        history:History;

        dimensions:Dimensions;

        constructor() {
            super();
            this.currentDirectory = process.env.HOME;
            this.history = new History();

            this.dimensions = {columns: 120, rows: 40};
        }

        execute(command:string):void {
            this.history.append(command);

            var parts = command.split(/\s+/);

            var commandName = parts.shift();
            var args = parts;

            if (commandName === 'cd') {
                this.cd(args);
            } else {
                var child = pty.spawn(commandName, args, {
                    cols: this.dimensions.columns,
                    rows: this.dimensions.rows,
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
        }

        cd(arguments) {
            var expanded = arguments[0].replace('~', process.env.HOME);

            this.setCurrentDirectory(expanded);
            this.emit('end');
        }

        setCurrentDirectory(path:string) {
            this.currentDirectory = path;
            this.emit('current-directory-changed', this.currentDirectory)
        }

        resize(dimensions) {
            this.dimensions = dimensions;

            if (this.currentCommand) {
                this.currentCommand.kill('SIGWINCH');
            }
        }
    }

    class History {
        stack:Array<string>;
        pointer:number;

        constructor() {
            this.stack = [];
            this.pointer = 0;
        }

        append(command:string):void {
            var duplicateIndex = this.stack.indexOf(command);

            if (duplicateIndex !== -1) {
                this.stack.splice(duplicateIndex, 1);
            }

            this.stack.push(command);
            this.pointer = this.stack.length;
        }

        previous():string {
            if (this.pointer > 0) {
                this.pointer -= 1;
            }

            return this.stack[this.pointer];
        }

        next():string {
            if (this.pointer < this.stack.length) {
                this.pointer += 1;
            }

            return this.stack[this.pointer];
        }
    }

    export class Terminal {
        shell:Shell;
        document:any;
        terminal:any;
        parser:any;

        constructor(document) {
            this.shell = new Shell();
            this.document = document;

            this.shell.on('data', this.processANSI.bind(this)).on('end', this.createPrompt.bind(this));

            this.createPrompt();

            this.terminal = {
                inst_p: function (s) {
                    console.log('print', s);
                },
                inst_o: function (s) {
                    console.log('osc', s);
                },
                inst_x: function (flag) {
                    console.log('execute', flag.charCodeAt(0));
                },
                inst_c: function (collected, params, flag) {
                    console.log('csi', collected, params, flag);
                },
                inst_e: function (collected, flag) {
                    console.log('esc', collected, flag);
                }
            };
            var AnsiParser = require('node-ansiparser');
            this.parser = new AnsiParser(this.terminal);

        }

        createPrompt() {
            Terminal.currentInput().removeClass('currentInput');
            Terminal.currentOutput().removeClass('currentOutput');

            var newInput = this.document.createElement("input");
            newInput.type = "text";
            $(newInput).addClass('currentInput');
            this.document.getElementById('board').appendChild(newInput);
            newInput.focus();
            this.addKeysHandler();

            var container = this.document.createElement("pre");
            container.className += 'currentOutput';

            this.document.getElementById('board').appendChild(container);
        }

        addKeysHandler() {
            Terminal.currentInput().keydown(function (e) {
                if (e.which === 13) {
                    this.shell.execute(Terminal.currentInput().val());

                    return false;
                }

                // Ctrl+P, ↑.
                if ((e.ctrlKey && e.keyCode === 80) || e.keyCode === 38) {
                    Terminal.currentInput().val(this.shell.history.previous());

                    return false;
                }

                // Ctrl+N, ↓.
                if ((e.ctrlKey && e.keyCode === 78) || e.keyCode === 40) {
                    Terminal.currentInput().val(this.shell.history.next());

                    return false;
                }
            }.bind(this));
        }

        processANSI(data) {
            var output = Terminal.currentOutput()[0];

            this.parser.parse(data);
            output.innerHTML += data;
        }

        static currentInput() {
            return $('.currentInput');
        }

        static currentOutput() {
            return $('.currentOutput');
        }

        resize(dimensions) {
            this.shell.resize(dimensions);
        }
    }
}

module.exports = BlackScreen.Terminal;
