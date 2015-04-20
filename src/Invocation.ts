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
        private cgrs: { [indexer: string]: Attributes };

        constructor(private directory: string,
                    private dimensions: Dimensions,
                    private history: History) {
            super();

            this.cgrs = {
                0: {color: Color.White, weight: Weight.Normal, underline: false},
                1: {weight: Weight.Bold},
                2: {weight: Weight.Faint},
                4: {underline: true},
                30: {color: Color.Black},
                31: {color: Color.Red},
                32: {color: Color.Green},
                33: {color: Color.Yellow},
                34: {color: Color.Blue},
                35: {color: Color.Magenta},
                36: {color: Color.Cyan},
                37: {color: Color.White}
            };

            this.prompt = new Prompt(directory);
            this.prompt.on('send', () => { this.execute(); });

            this.buffer = new Buffer();
            //this.buffer.on('data', _.throttle(() => { this.emit('data'); }, 1000/60));

            this.parser = new AnsiParser({
                inst_p: (text: string) => {
                    console.log('text', text);

                    for (var i = 0; i != text.length; ++i) {
                        this.buffer.write(text.charAt(i));
                    }
                },
                inst_o: function (s: any) {
                    console.error('osc', s);
                },
                inst_x: (flag: string) => {
                    this.buffer.write(flag);
                },
                inst_c: (collected: any, params: any, flag: any) => {
                    if (flag == 'm') {
                        params.forEach((cgr: number) => {
                            this.buffer.setAttributes(this.cgrs[cgr] || {});
                        })

                    }
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

            this.command.on('data', (data: string) => {
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
