/// <reference path="references.ts" />

var pty = require('pty.js');
var _: _.LoDashStatic = require('lodash');

module BlackScreen {
    export class Invocation extends EventEmitter {
        private command: NodeJS.Process;
        private parser: Parser;
        private prompt: Prompt;
        private buffer: Buffer;

        constructor(private directory: string,
                    private dimensions: Dimensions,
                    private history: History) {
            super();

            this.prompt = new Prompt(directory);
            this.prompt.on('send', () => { this.execute(); });

            this.buffer = new Buffer();
            this.buffer.on('data', _.throttle(() => { this.emit('data'); }, 1000/10));

            this.parser = new Parser(this.buffer);
        }

        execute(): void {
            var command = this.prompt.getCommand();
            if (Command.isBuiltIn(command)) {
                this.emit('working-directory-changed', Command.cd(this.directory, this.prompt.getArguments()));
                this.emit('end');
            } else {
                this.command = pty.spawn(command, this.prompt.getArguments(), {
                    cols: this.dimensions.columns,
                    rows: this.dimensions.rows,
                    cwd: this.directory,
                    env: process.env
                });

                this.command.on('data', (data: string) => {
                    this.parser.parse(data);
                }).on('end', () => {
                    this.emit('end');
                })
            }
        }

        resize(dimensions: Dimensions) {
            this.dimensions = dimensions;

            if (this.command) {
                this.command.kill(this.command.pid, 'SIGWINCH');
            }
        }

        getBuffer(): Buffer {
            return this.buffer;
        }

        getPrompt(): Prompt {
            return this.prompt;
        }
    }
}
