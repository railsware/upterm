/// <reference path="references.ts" />

var pty = require('pty.js');
var _: _.LoDashStatic = require('lodash');

module BlackScreen {
    export class Invocation extends EventEmitter {
        private command: NodeJS.Process;
        private parser: Parser;
        private prompt: Prompt;
        private buffer: Buffer;
        public id: string;
        public status: Status = Status.NotStarted;

        constructor(private directory: string,
                    private dimensions: Dimensions,
                    private history: History) {
            super();

            this.prompt = new Prompt(directory);
            this.prompt.on('send', () => { this.execute(); });

            this.buffer = new Buffer();
            this.buffer.on('data', _.throttle(() => { this.emit('data'); }, 1000/3));

            this.parser = new Parser(this.buffer);
            this.id = `invocation-${new Date().getTime()}`
        }

        execute(): void {
            var command = this.prompt.getCommandName();

            if (Command.isBuiltIn(command)) {
                try {
                    var newDirectory = Command.cd(this.directory, this.prompt.getArguments());
                    this.emit('working-directory-changed', newDirectory);
                } catch (error) {
                    this.buffer.writeString(error.message, {color: Color.Red});
                }

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
                }).on('exit', (code: number, signal: string) => {
                    if (code === 0) {
                        this.status = Status.Success;
                    } else {
                        this.status = Status.Failure;
                    }
                    this.emit('end');
                })
            }
        }

        hasOutput(): boolean {
            return !this.buffer.isEmpty();
        }

        resize(dimensions: Dimensions) {
            this.dimensions = dimensions;

            if (this.command) {
                this.command.kill(this.command.pid, 'SIGWINCH');
            }
        }

        canBeDecorated(): boolean {
            for (var Decorator of Decorators.list) {
                if ((new Decorator(this)).isApplicable()) {
                    return true;
                }
            }
            return false;
        }

        decorate(): any {
            for (var Decorator of Decorators.list) {
                var decorator: Decorators.Base = new Decorator(this);
                if (decorator.isApplicable()) {
                    return decorator.decorate();
                }
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
