/// <reference path="references.ts" />

var pty = require('pty.js');
var AnsiParser: AnsiParserConstructor = require('node-ansiparser');
var _: _.LoDashStatic = require('lodash');

module BlackScreen {
    export class Invocation extends EventEmitter {
        private command: NodeJS.Process;
        private parser: AnsiParser;
        private prompt: Prompt;
        private buffer: Buffer;

        constructor(private directory: string,
                    private dimensions: Dimensions,
                    private history: History) {
            super();

            this.prompt = new Prompt(directory, history);
            this.prompt.on('send', () => { this.execute(); });

            this.buffer = new Buffer();
            this.buffer.on('data', _.throttle(() => { this.emit('data'); }, 1000/60));

            this.parser = new AnsiParser({
                inst_p: (text: string) => {
                    console.log('text', text);

                    for (var i = 0; i != text.length; ++i) {
                        this.buffer.write(new Char(text.charAt(i)));
                    }
                },
                inst_o: function (s: any) {
                    console.error('osc', s);
                },
                inst_x: (flag: string) => {
                    this.buffer.write(new Char(flag));
                },
                inst_c: function (collected: any, params: any, flag: any) {
                    console.error('csi', collected, params, flag);
                },
                inst_e: function (collected: any, flag: any) {
                    console.error('esc', collected, flag);
                }
            });

        }

        execute(): void {
            this.command = pty.spawn(this.prompt.getCommand(), this.prompt.getArguments(), {
                cols: this.dimensions.columns,
                rows: this.dimensions.rows,
                cwd: this.directory,
                env: process.env
            });

            this.command.on('data', (data) => {
                this.parser.parse(data);
            }).on('end', () => {
                this.emit('end');
            })
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
