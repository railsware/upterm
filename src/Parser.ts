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
    erase: {
        toEnd: 0,
        toBeginning: 1,
        entire: 2,
    }
};

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
        // TODO: The parser is a mess, but I tried to make it
        // TODO: an easy to clean up mess.
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
            /**
             * CSI handler.
             */
            inst_c: (collected: any, params: Array<number>, flag: string) => {
                if (collected == '?') {
                    if (params.length != 1) {
                        return Utils.error(`CSI private mode has ${params.length} parameters: ${params}`);
                    }
                    if (flag != 'h' && flag != 'l') {
                        return Utils.error(`CSI private mode has an incorrect flag: ${flag}`);
                    }
                    var mode = params[0];
                    var handlerResult = this.decPrivateModeHandler(mode, flag);

                    if (handlerResult.status == 'handled') {
                        Utils.log(`%cCSI ? ${mode} ${flag}`, "color: blue", handlerResult.description, handlerResult.url);
                    } else {
                        Utils.error(`%cCSI ? ${mode} ${flag}`, "color: blue", handlerResult.description, handlerResult.url);
                    }
                } else {
                    handlerResult = this.csiHandler(collected, params, flag);

                    if (handlerResult.status == 'handled') {
                        Utils.log(`%cCSI ${collected} ${flag}`, "color: blue", handlerResult.description, handlerResult.url);
                    } else {
                        Utils.error(`%cCSI ${collected} ${flag}`, "color: blue", handlerResult.description, handlerResult.url);
                    }
                }
            },
            /**
             * ESC handler.
             */
            inst_e: (collected: any, flag: string) => {
                var handlerResult = this.escapeHandler(collected, flag);

                if (handlerResult.status == 'handled') {
                    Utils.log(`%cESC ${collected} ${flag}`, "color: blue", handlerResult.description, handlerResult.url);
                } else {
                    Utils.error(`%cESC ${collected} ${flag}`, "color: blue", handlerResult.description, handlerResult.url);
                }
            }
        });
    }

    private escapeHandler(collected: any, flag: string) {
        var short = '';
        var long = '';
        var url = '';
        var status = 'handled';

        if (collected) {
            if (collected == '#' && flag == '8') {
                short = 'DEC Screen Alignment Test (DECALN).';
                url = "http://www.vt100.net/docs/vt510-rm/DECALN";

                var dimensions = this.invocation.getDimensions();

                for (var i = 0; i != dimensions.rows; ++i) {
                    this.buffer.moveCursorAbsolute({vertical: i, horizontal: 0});
                    this.buffer.writeString(Array(dimensions.columns).join("E"));
                }

                this.buffer.moveCursorAbsolute({vertical: 0, horizontal: 0});
            } else {
                status = 'unhandled';
            }
        } else {
            switch (flag) {
                case 'A':
                    short = "Cursor up.";

                    this.buffer.moveCursorRelative({vertical: -1});
                    break;
                case 'B':
                    short = "Cursor down.";

                    this.buffer.moveCursorRelative({vertical: 1});
                    break;
                case 'C':
                    short = "Cursor right.";

                    this.buffer.moveCursorRelative({horizontal: 1});
                    break;
                case 'D':
                    short = "Cursor left.";

                    this.buffer.moveCursorRelative({horizontal: -1});
                    break;
                case 'M':
                    short = "Reverse Index (RI).";
                    long = "Move the active position to the same horizontal position on the preceding line. If the active position is at the top margin, a scroll down is performed. Format Effector";

                    this.buffer.moveCursorRelative({vertical: -1});
                    break;
                case 'E':
                    short = "Next Line (NEL).";
                    long = "This sequence causes the active position to move to the first position on the next line downward. If the active position is at the bottom margin, a scroll up is performed. Format Effector";

                    this.buffer.moveCursorRelative({vertical: 1});
                    this.buffer.moveCursorAbsolute({horizontal: 0});
                    break;
                default:
                    status = 'unhandled';
            }
        }

        return {
            status: status,
            description: short,
            longDescription: long,
            url: url
        };
    }

    private decPrivateModeHandler(ps: number, flag: string) {
        var description = '';
        var url = '';
        var status = 'handled';
        var isSet = flag == 'h';

        //noinspection FallThroughInSwitchStatementJS
        switch (ps) {
            case 3:
                url = "http://www.vt100.net/docs/vt510-rm/DECCOLM";

                if (!isSet) {
                    description = "80 Column Mode (DECCOLM)";

                    this.invocation.setDimensions({columns: 80, rows: this.invocation.getDimensions().rows});
                    break;
                }
            case 12:
                if (isSet) {
                    description = "Start Blinking Cursor (att610).";

                    this.buffer.blinkCursor(true);
                } else {
                    description = "Stop Blinking Cursor (att610).";

                    this.buffer.blinkCursor(false);
                }

                break;
            case 25:
                url = "http://www.vt100.net/docs/vt510-rm/DECTCEM";

                if (isSet) {
                    description = "Show Cursor (DECTCEM).";

                    this.buffer.showCursor(true);
                } else {
                    description = "Hide Cursor (DECTCEM).";

                    this.buffer.showCursor(false);
                }
                break;
            case 1049:
                if (isSet) {
                    description = "Save cursor as in DECSC and use Alternate Screen Buffer, clearing it first.  (This may be disabled by the titeInhibit resource).  This combines the effects of the 1047  and 1048  modes.  Use this with terminfo-based applications rather than the 47  mode.";

                    this.buffer.activeBuffer = 'alternate';
                    // TODO: Add Implementation
                    break;
                }
            case 2004:
                if (isSet) {
                    description = "Set bracketed paste mode.";
                    // TODO: Add Implementation
                    break;
                }
            default:
                status = 'unhandled';
        }

        return {
            status: status,
            description: description,
            url: url
        };
    }

    private csiHandler(collected: any, params: Array<number>, flag: string) {
        var short = '';
        var long = '';
        var url = '';
        var status = 'handled';

        switch (flag) {
            case 'm':
                short = 'Some CGR stuff';

                if (params.length == 0) {
                    short = 'Reset CGR';
                    this.buffer.setAttributes(CGR[0]);
                    break;
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
                    } else if (attributeToSet == 'negative') {
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
            case 'A':
                short = 'Cursor Up Ps Times (default = 1) (CUU).';

                this.buffer.moveCursorRelative({vertical: -(params[1] || 1)});
                break;
            case 'B':
                short = 'Cursor Down Ps Times (default = 1) (CUD).';
                this.buffer.moveCursorRelative({vertical: (params[1] || 1)});
                break;
            case 'C':
                short = 'Cursor Forward Ps Times (default = 1) (CUF).';

                this.buffer.moveCursorRelative({horizontal: (params[1] || 1)});
                break;
            case 'D':
                short = 'Cursor Backward Ps Times (default = 1) (CUB).';

                this.buffer.moveCursorRelative({horizontal: -(params[1] || 1)});
                break;
            // CSI Ps E  Cursor Next Line Ps Times (default = 1) (CNL).
            // CSI Ps F  Cursor Preceding Line Ps Times (default = 1) (CPL).
            // CSI Ps G  Cursor Character Absolute  [column] (default = [row,1]) (CHA).
            case 'H':
                short = 'Cursor Position [row;column] (default = [1,1]) (CUP).';
                url = 'http://www.vt100.net/docs/vt510-rm/CUP';

                this.buffer.moveCursorAbsolute({vertical: params[0] || 0, horizontal: params[1] || 0});
                break;
            case 'f':
                short = 'Horizontal and Vertical Position [row;column] (default = [1,1]) (HVP).';
                url = 'http://www.vt100.net/docs/vt510-rm/HVP';

                this.buffer.moveCursorAbsolute({vertical: params[0] || 0, horizontal: params[1] || 0});
                break;
            case 'J':
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
            case 'K':
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
            default:
                status = 'unhandled';
        }

        return {
            status: status,
            description: short,
            longDescription: long,
            url: url
        };
    }
}

export = Parser;
