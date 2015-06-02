var AnsiParser: AnsiParserConstructor = require('node-ansiparser');

import e = require('./Enums');
import i = require('./Interfaces');
import Utils = require('./Utils');
import Buffer = require('./Buffer');

import Color = e.Color;
import Weight = e.Weight;

var CGR: { [indexer: string]: i.Attributes } = {
    0: {color: Color.White, weight: e.Weight.Normal, underline: false, 'background-color': Color.Black},
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
    37: {color: Color.White},
    40: {'background-color': Color.Black},
    41: {'background-color': Color.Red},
    42: {'background-color': Color.Green},
    43: {'background-color': Color.Yellow},
    44: {'background-color': Color.Blue},
    45: {'background-color': Color.Magenta},
    46: {'background-color': Color.Cyan},
    47: {'background-color': Color.White}
};

var CSI = {
    mode: {
        blinkingCursor: 12,
        cursor: 25,
        scrollbar: 30,
        alternateScreen: 1049,
        bracketedPaste: 2004,
    },
    flag: {
        eraseDisplay: 'J',
        selectGraphicRendition: 'm',
        cursorPosition: 'H',
        setMode: 'h',
        resetMode: 'l'
    },
    eraseDisplay: {
        toEndOfScreen: 0,
        toBeginningOfScreen: 1,
        entireScreen: 2,
    }
};

var DECPrivateMode = '?';

class Parser {
    private parser: AnsiParser;

    constructor(private buffer: Buffer) {
        this.parser = this.initializeAnsiParser();
    }

    parse(data: string): void {
        this.parser.parse(data);
    }

    private initializeAnsiParser(): AnsiParser {
        return new AnsiParser({
            inst_p: (text: string) => {
                Utils.log('text', text);

                for (var i = 0; i != text.length; ++i) {
                    this.buffer.write(text.charAt(i));
                }
            },
            inst_o: function (s: any) {
                Utils.error('osc', s);
            },
            inst_x: (flag: string) => {
                Utils.log('flag', flag);
                this.buffer.write(flag);
            },
            inst_c: (collected: any, params: Array<number>, flag: string) => {
                switch (flag) {
                    case CSI.flag.selectGraphicRendition:
                        if (params.length == 0) {
                            this.buffer.setAttributes(CGR[0]);
                            return;
                        }

                        while (params.length) {
                            var cgr = params.shift();

                            if (cgr == 48) {
                                var next = params.shift();
                                if (next == 5) {
                                    var backgroundColorIndex = params.shift();
                                    this.buffer.setAttributes({'background-color': e.ColorIndex[backgroundColorIndex]});
                                }
                            } else {
                                this.buffer.setAttributes(CGR[cgr] || {});
                            }
                        }

                        Utils.log('csi', collected, params, flag);
                        break;
                    case CSI.flag.cursorPosition:
                        this.buffer.cursor.moveAbsolute({vertical: params[0], horizontal: params[1]});
                        break;
                    case CSI.flag.eraseDisplay:
                        switch (params[0]) {
                            case CSI.eraseDisplay.entireScreen:
                                this.buffer.clear();
                                break;
                        }
                        break;
                    case CSI.flag.setMode:
                        if (collected != DECPrivateMode) {
                            return console.error('Private mode sequence should start with a ?. Started with', collected);
                        }

                        if (params.length != 1) {
                            return console.error('CSI mode has multiple arguments:', params);
                        }

                        switch (params[0]) {
                            case CSI.mode.blinkingCursor:
                                this.buffer.setAttributes({'background-color': e.Color.White, blinking: true});
                                break;
                            case CSI.mode.cursor:
                                this.buffer.setAttributes({'background-color': e.Color.White, blinking: false});
                                break;
                            case CSI.mode.alternateScreen:
                                Utils.log('Switching to an alternate screen.');
                                break;
                            case CSI.mode.bracketedPaste:
                                Utils.log('Enabling bracketed paste');
                                break;
                            default:
                                Utils.log('Unknown CSI mode:', params[0]);
                        }
                        break;
                    default:
                        Utils.error('csi', collected, params, flag);
                }
            },
            inst_e: function (collected: any, flag: any) {
                Utils.error('esc', collected, flag);
            }
        });
    }
}

export = Parser;
