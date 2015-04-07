/// <reference path="references.ts" />

var pty = require('pty.js');

module BlackScreen {

    export class Shell extends EventEmitter {
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

}
