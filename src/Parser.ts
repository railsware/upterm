import Invocation = require("./Invocation");
var ANSIParser: AnsiParserConstructor = require('node-ansiparser');

import e = require('./Enums');
import i = require('./Interfaces');
import Utils = require('./Utils');
import Buffer = require('./Buffer');

import Color = e.Color;
import Weight = e.Weight;

var CGR: { [indexer: string]: i.Attributes|string } = {
    0: {color: Color.White, weight: e.Weight.Normal, underline: false, 'background-color': Color.Black},
    1: {weight: Weight.Bold},
    2: {weight: Weight.Faint},
    4: {underline: true},
    7: 'negative',
    30: {color: Color.Black},
    31: {color: Color.Red},
    32: {color: Color.Green},
    33: {color: Color.Yellow},
    34: {color: Color.Blue},
    35: {color: Color.Magenta},
    36: {color: Color.Cyan},
    37: {color: Color.White},
    38: 'color',
    40: {'background-color': Color.Black},
    41: {'background-color': Color.Red},
    42: {'background-color': Color.Green},
    43: {'background-color': Color.Yellow},
    44: {'background-color': Color.Blue},
    45: {'background-color': Color.Magenta},
    46: {'background-color': Color.Cyan},
    47: {'background-color': Color.White},
    48: 'background-color'
};

function isSetColorExtended(cgrValue: any) {
    return cgrValue == 'color' || cgrValue == 'background-color';
}

var CSI = {
    mode: {
        blinkingCursor: 12,
        cursor: 25,
        scrollbar: 30,
        alternateScreen: 1049,
        bracketedPaste: 2004,
    },
    flag: {
        cursorPosition: 'H',
        eraseDisplay: 'J',
        eraseInLine: 'K',
        setMode: 'h',
        resetMode: 'l',
        selectGraphicRendition: 'm'
    },
    erase: {
        toEnd: 0,
        toBeginning: 1,
        entire: 2,
    }
};

var DECPrivateMode = '?';

class Parser {
    private parser: AnsiParser;
    private buffer: Buffer;

    constructor(private invocation: Invocation) {
        this.buffer = this.invocation.getBuffer();
        this.parser = this.initializeAnsiParser();
    }

    parse(data: string): void {
        this.parser.parse(data);
    }

    private initializeAnsiParser(): AnsiParser {
        return new ANSIParser({
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
                Utils.log('csi', collected, params, flag);

                switch (flag) {
                    case CSI.flag.selectGraphicRendition:
                        if (params.length == 0) {
                            this.buffer.setAttributes(CGR[0]);
                            return;
                        }

                        while (params.length) {
                            var cgr = params.shift();

                            var attributeToSet = CGR[cgr];

                            if (!attributeToSet) {
                                Utils.error('cgr', cgr, params);
                            } else if (isSetColorExtended(attributeToSet)) {
                                var next = params.shift();
                                if (next == 5) {
                                    var colorIndex = params.shift();
                                    this.buffer.setAttributes({[<string>attributeToSet]: e.ColorIndex[colorIndex]});
                                } else {
                                    Utils.error('cgr', cgr, next, params);
                                }
                            } else if (attributeToSet == 'negative'){
                                var attributes = this.buffer.getAttributes();

                                this.buffer.setAttributes({
                                    'background-color': attributes.color,
                                    'color': attributes['background-color']
                                });
                            } else {
                                this.buffer.setAttributes(attributeToSet);
                            }
                        }
                        break;
                    case CSI.flag.cursorPosition:
                        this.buffer.moveCursorAbsolute({vertical: params[0], horizontal: params[1]});
                        break;
                    case CSI.flag.eraseDisplay:
                        switch (params[0]) {
                            case CSI.erase.entire:
                                this.buffer.clear();
                                break;
                            case CSI.erase.toEnd:
                            case undefined:
                                this.buffer.clearToEnd();
                                break;
                            case CSI.erase.toBeginning:
                                this.buffer.clearToBeginning();
                                break;
                        }
                        break;

                    case 'c':
                        this.invocation.write('\x1b>1;2;');
                        break;
                    case CSI.flag.eraseInLine:
                        switch (params[0]) {
                            case CSI.erase.entire:
                                this.buffer.clearRow();
                                break;
                            case CSI.erase.toEnd:
                            case undefined:
                                this.buffer.clearRowToEnd();
                                break;
                            case CSI.erase.toBeginning:
                                this.buffer.clearRowToBeginning();
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
                                this.buffer.blinkCursor(true);
                                break;
                            case CSI.mode.cursor:
                                this.buffer.showCursor(true);
                                break;
                            case CSI.mode.alternateScreen:
                                Utils.log('Switching to an alternate screen.');
                                this.buffer.activeBuffer = 'alternate';
                                break;
                            case CSI.mode.bracketedPaste:
                                Utils.log('Enabling bracketed paste');
                                break;
                            default:
                                Utils.error('Unknown CSI mode:', params[0]);
                        }
                        break;
                    case CSI.flag.resetMode:
                        if (collected != DECPrivateMode) {
                            return console.error('Private mode sequence should start with a ?. Started with', collected);
                        }

                        if (params.length != 1) {
                            return console.error('CSI mode has multiple arguments:', params);
                        }

                        switch (params[0]) {
                            case CSI.mode.blinkingCursor:
                                this.buffer.blinkCursor(false);
                                break;
                            case CSI.mode.cursor:
                                this.buffer.showCursor(false);
                                break;
                            default:
                                Utils.error('Unknown CSI reset:', params[0]);
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
