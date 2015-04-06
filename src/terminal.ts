/// <reference path="../dts/black_screen.d.ts" />

import $ = require('jquery');
import lodash = require('lodash');
var pty = require('pty.js');
import events = require('events');
var AnsiParser = require('node-ansiparser');

module BlackScreen {
    interface Dimensions {
        columns: number;
        rows: number;
    }

    interface Position {
        column: number;
        row: number;
    }

    class Shell extends events.EventEmitter {
        currentDirectory: string;
        currentCommand: any;
        history: History;
        aliases: Object;
        buffer: Buffer;

        dimensions: Dimensions;

        constructor() {
            super();
            this.currentDirectory = process.env.HOME;
            this.history = new History();

            this.aliases = {};
            this.importAliasesFrom('zsh');

            this.dimensions = {columns: 120, rows: 40};
            this.buffer = new Buffer(this.dimensions);
        }

        importAliasesFrom(shellName: string): void {
            var aliases = '';
            var zsh = pty.spawn(shellName, ['-i', '-c', 'alias'], {env: process.env});

            zsh.on('data', (text) => {
                aliases += text
            });

            zsh.on('end', function () {
                aliases.split('\n').forEach((alias) => {
                    var split = alias.split('=');
                    this.aliases[split[0]] = /'?([^']*)'?/.exec(split[1])[1];
                });
            }.bind(this));
        }

        execute(command: string): void {
            var parts = this.expandCommand(command);
            var expanded = parts.join(' ');

            Terminal.currentInput().val(expanded);
            this.history.append(expanded);

            var commandName = parts.shift();
            var arguments = parts;

            if (commandName === 'cd') {
                this.cd(arguments);
            } else {
                var child = pty.spawn(commandName, arguments, {
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

        expandCommand(command: string): Array<string> {
            // Split by comma, but not inside quotes.
            // http://stackoverflow.com/questions/16261635/javascript-split-string-by-space-but-ignore-space-in-quotes-notice-not-to-spli
            var parts = command.match(/(?:[^\s']+|'[^']*')+/g);
            var commandName = parts.shift();

            var alias = this.aliases[commandName];

            if (alias) {
                parts = this.expandCommand(alias).concat(parts);
            } else {
                parts.unshift(commandName);
            }

            return parts;
        }

        cd(arguments) {
            var expanded: string = arguments[0].replace('~', process.env.HOME);

            if (expanded.charAt(0) == '/') {
                this.setCurrentDirectory(expanded);
            } else {
                this.setCurrentDirectory(`${this.currentDirectory}/${expanded}`);
            }

            this.emit('end');
        }

        setCurrentDirectory(path: string) {
            this.currentDirectory = path;
            this.emit('current-directory-changed', this.currentDirectory)
        }

        resize(dimensions) {
            this.dimensions = dimensions;
            this.buffer.resize(dimensions);

            if (this.currentCommand) {
                this.currentCommand.kill('SIGWINCH');
            }
        }
    }

    class History {
        stack: Array<string>;
        pointer: number;

        constructor() {
            this.stack = [];
            this.pointer = 0;
        }

        append(command: string): void {
            var duplicateIndex = this.stack.indexOf(command);

            if (duplicateIndex !== -1) {
                this.stack.splice(duplicateIndex, 1);
            }

            this.stack.push(command);
            this.pointer = this.stack.length;
        }

        previous(): string {
            if (this.pointer > 0) {
                this.pointer -= 1;
            }

            return this.stack[this.pointer];
        }

        next(): string {
            if (this.pointer < this.stack.length) {
                this.pointer += 1;
            }

            return this.stack[this.pointer];
        }
    }

    export class Terminal {
        shell: Shell;
        document: any;
        parser: any;

        constructor(document) {
            this.shell = new Shell();
            this.document = document;

            this.shell.on('data', this.processANSI.bind(this)).on('end', function () {
                Terminal.appendToOutput(this.shell.buffer.toString());
                this.shell.buffer = new Buffer(this.shell.dimensions);
                this.createPrompt();
            }.bind(this));

            this.createPrompt();
            this.parser = new AnsiParser({
                inst_p: (text) => {
                    for (var i = 0; i != text.length; ++i) {
                        this.shell.buffer.write(new Char(text.charAt(i)));
                    }
                    console.log('print', text);
                },
                inst_o: function (s) {
                    console.error('osc', s);
                },
                inst_x: (flag) => {
                    console.log('execute', flag.charCodeAt(0));

                    //if (flag.charCodeAt(0) == 13) {
                    //    Terminal.appendToOutput('\r');
                    //} else
                    if (flag.charCodeAt(0) == 10) {
                        this.shell.buffer.write(new Char('\n'));
                    } else if (flag.charCodeAt(0) == 9) {
                        this.shell.buffer.write(new Char('\t'));
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
            $('html, body').animate({scrollTop: $(document).height()}, 'slow');
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

        static appendToOutput(text: string) {
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
        buffer: Array<Array<Char>>;
        private cursor: Position;

        constructor(public dimensions: Dimensions) {
            this.buffer = Buffer.array2dOf(1, dimensions.columns, () => { return new Char(' '); });
            this.cursor = {row: 0, column: 0};
        }

        resize(dimensions: Dimensions): void {
            this.dimensions = dimensions;
            var newBuffer = Buffer.array2dOf(this.buffer.length, dimensions.columns, () => { return new Char(' '); });

            for (var row = 0; row != this.buffer.length; row++) {
                for (var column = 0; column != this.buffer[0].length; column++) {
                    if (row < dimensions.rows && column < dimensions.columns) {
                        newBuffer[row][column] = this.buffer[row][column];
                    }
                }
            }

            this.buffer = newBuffer;
        }

        static array2dOf(rows: number, columns: number, producer: any): Array<Array<Char>> {
            return Buffer.arrayOf(rows, () => {
                return Buffer.arrayOf(columns, producer);
            });
        }

        static arrayOf(n: number, producer: any): any {
            var array = new Array(n);

            for (var i = 0; i != n; i++) {
                array[i] = producer();
            }

            return array;
        }

        at(position: Position): Char {
            return this.buffer[position.row][position.column];
        }

        setAt(position: Position, element: Char): boolean {
            if (this.isWithinBoundaries(position)) {
                this.buffer[position.row][position.column] = element;
                return true;
            }

            return false;
        }

        write(element: Char): boolean {
            if (element.isNewLine()) {
                this.buffer.push(Buffer.arrayOf(this.buffer[0].length, () => { return new Char(' '); }));
                this.cursor = {row: this.cursor.row + 1, column: 0 }
            } else {
                if (this.setAt(this.cursor, element)) {
                    this.advanceCursor();
                    return true;
                }

                return false;
            }
        }

        moveCursor(position: Position): boolean {
            if (this.isWithinBoundaries(position)) {
                this.cursor = position;
                return true;
            }

            return false;
        }

        advanceCursor() {
            if (this.cursor.column + 1 < this.buffer[0].length) {
                this.moveCursor({column: this.cursor.column + 1, row: this.cursor.row});
            } else {
                debugger;
                if (this.cursor.row + 1 >= this.buffer.length){
                    this.buffer.push(Buffer.arrayOf(this.buffer[0].length, () => { return new Char(' '); }));
                }

                this.moveCursor({column: 0, row: this.cursor.row + 1});
            }
        }

        toString(): string {
            return this.buffer.map((row) => {
                return row.map((char) => {
                    return char.toString();
                }).join('')
            }).join('\n');
        }

        private isWithinBoundaries(position: Position): boolean {
            return position.row < this.buffer.length && position.column < this.buffer[0].length;
        }
    }

    class Char {
        constructor(public char: string) {
            if (char.length != 1) {
                throw(`Char can be created only from a single character; passed ${char.length}: ${char}`)
            }
        }

        toString(): string {
            return this.char;
        }

        isNewLine(): boolean {
            return this.char == '\n';
        }
    }
}

module.exports = BlackScreen.Terminal;
