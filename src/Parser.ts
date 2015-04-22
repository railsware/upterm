/// <reference path="references.ts" />

var AnsiParser: AnsiParserConstructor = require('node-ansiparser');

module BlackScreen {
    export class Parser {
        private parser: AnsiParser;
        private static CGRs: { [indexer: string]: Attributes } = {
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

        constructor(private buffer: Buffer) {
            this.parser = this.initializeAnsiParser();
        }

        parse(data: string): void {
            this.parser.parse(data);
        }

        private initializeAnsiParser(): AnsiParser {
            return new AnsiParser({
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
                    console.log('flag', flag);
                    this.buffer.write(flag);
                },
                inst_c: (collected: any, params: Array<number>, flag: any) => {
                    if (flag == 'm') {
                        params.forEach((cgr: number) => {
                            this.buffer.setAttributes(Parser.CGRs[cgr] || {});
                        });

                        console.log('csi', collected, params, flag);
                    } else if (flag == 'H') {
                        this.buffer.cursor.moveAbsolute({vertical: params[0], horizontal: params[1]});
                    } else {
                        console.error('csi', collected, params, flag);
                    }
                },
                inst_e: function (collected: any, flag: any) {
                    console.error('esc', collected, flag);
                }
            });
        }
    }
}
