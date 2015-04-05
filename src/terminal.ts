/// <reference path="../dts/black_screen.d.ts" />

import $ = require('jquery');
import lodash = require('lodash');
var pty = require('pty.js');
import events = require('events');
var AnsiParser = require('node-ansiparser');

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
        parser:any;

        constructor(document) {
            this.shell = new Shell();
            this.document = document;

            this.shell.on('data', this.processANSI.bind(this)).on('end', this.createPrompt.bind(this));

            this.createPrompt();
            this.parser = new AnsiParser({
                inst_p: function (text) {
                    Terminal.appendToOutput(text);
                    console.log('print', text);
                },
                inst_o: function (s) {
                    console.error('osc', s);
                },
                inst_x: function (flag) {
                    console.log('execute', flag.charCodeAt(0));

                    //if (flag.charCodeAt(0) == 13) {
                    //    Terminal.appendToOutput('\r');
                    //} else
                    if (flag.charCodeAt(0) == 10) {
                        Terminal.appendToOutput('\n');
                    } else if (flag.charCodeAt(0) == 9) {
                        Terminal.appendToOutput('\t');
                    } else {
                        console.error('execute', flag.charCodeAt(0));
                    }
                },
                inst_c: function (collected, params, flag) {
                    console.error('csi', collected, params, flag);
                },
                inst_e: function (collected, flag) {
                    console.error('esc', collected, flag);
                }
            });

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
            this.parser.parse(data);
        }

        static appendToOutput(text:string) {
            Terminal.currentOutput()[0].innerHTML += text;
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

    class Buffer {
        private buffer:Array<Array<Char>>;

        constructor(public dimensions:Dimensions) {

        }
    }

    class Char {
        constructor(private char:string) {
            if (char.length != 1) {
                throw(`Char can be created only from a single character; passed ${char.length}: ${char}`)
            }
        }
    }
}

module.exports = BlackScreen.Terminal;
