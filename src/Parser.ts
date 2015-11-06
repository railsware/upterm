import Invocation from "./Invocation";
import Char from "./Char";
var ANSIParser: AnsiParserConstructor = require('node-ansiparser');

import * as e from './Enums';
import * as i from './Interfaces';
import Utils from './Utils';
import Buffer from './Buffer';

import Color = e.Color;
import Weight = e.Weight;

var SGR: { [indexer: string]: i.Attributes|string } = {
    0: { color: Color.White, weight: e.Weight.Normal, underline: false, 'background-color': Color.Black },
    1: { weight: Weight.Bold },
    2: { weight: Weight.Faint },
    4: { underline: true },
    7: 'negative',
    30: { color: Color.Black },
    31: { color: Color.Red },
    32: { color: Color.Green },
    33: { color: Color.Yellow },
    34: { color: Color.Blue },
    35: { color: Color.Magenta },
    36: { color: Color.Cyan },
    37: { color: Color.White },
    38: 'color',
    40: { 'background-color': Color.Black },
    41: { 'background-color': Color.Red },
    42: { 'background-color': Color.Green },
    43: { 'background-color': Color.Yellow },
    44: { 'background-color': Color.Blue },
    45: { 'background-color': Color.Magenta },
    46: { 'background-color': Color.Cyan },
    47: { 'background-color': Color.White },
    48: 'background-color'
};

function isSetColorExtended(sgrValue: any) {
    return sgrValue === 'color' || sgrValue === 'background-color';
}

var CSI = {
    erase: {
        toEnd: 0,
        toBeginning: 1,
        entire: 2,
    }
};

export default class Parser {
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
                Utils.info('text', text, text.split('').map(letter => letter.charCodeAt(0)));

                this.buffer.writeString(text);

                logPosition(this.buffer);
            },
            inst_o: function (s: any) {
                Utils.error('osc', s);
            },
            inst_x: (flag: string) => {
                var char = Char.flyweight(flag, this.invocation.getBuffer().getAttributes());
                var name = e.CharCode[char.getCharCode()];

                Utils.print((name ? e.LogLevel.Log : e.LogLevel.Error), flag.split('').map((_, index) => flag.charCodeAt(index)));

                this.buffer.write(flag);

                logPosition(this.buffer);
            },
            /**
             * CSI handler.
             */
            inst_c: (collected: any, params: Array<number>, flag: string) => {
                if (collected === '?') {
                    if (params.length !== 1) {
                        return Utils.error(`CSI private mode has ${params.length} parameters: ${params}`);
                    }
                    if (flag !== 'h' && flag !== 'l') {
                        return Utils.error(`CSI private mode has an incorrect flag: ${flag}`);
                    }
                    var mode = params[0];
                    var handlerResult = this.decPrivateModeHandler(mode, flag);

                    if (handlerResult.status === 'handled') {
                        Utils.info(`%cCSI ? ${mode} ${flag}`, "color: blue", handlerResult.description, handlerResult.url);
                    } else {
                        Utils.error(`%cCSI ? ${mode} ${flag}`, "color: blue", handlerResult.description, handlerResult.url);
                    }
                } else {
                    handlerResult = this.csiHandler(collected, params, flag);

                    if (handlerResult.status === 'handled') {
                        Utils.info(`%cCSI ${params} ${flag}`, "color: blue", handlerResult.description, handlerResult.url);
                    } else {
                        Utils.error(`%cCSI ${params} ${flag}`, "color: blue", handlerResult.description, handlerResult.url);
                    }
                }

                logPosition(this.buffer);
            },
            /**
             * ESC handler.
             */
            inst_e: (collected: any, flag: string) => {
                var handlerResult = this.escapeHandler(collected, flag);

                if (handlerResult.status === 'handled') {
                    Utils.info(`%cESC ${collected} ${flag}`, "color: blue", handlerResult.description, handlerResult.url);
                } else {
                    Utils.error(`%cESC ${collected} ${flag}`, "color: blue", handlerResult.description, handlerResult.url);
                }

                logPosition(this.buffer);
            }
        });
    }

    private escapeHandler(collected: any, flag: string) {
        var short = '';
        var long = '';
        var url = '';
        var status = 'handled';

        if (collected) {
            if (collected === '#' && flag === '8') {
                short = 'DEC Screen Alignment Test (DECALN).';
                url = "http://www.vt100.net/docs/vt510-rm/DECALN";

                var dimensions = this.invocation.getDimensions();

                for (var i = 0; i !== dimensions.rows; ++i) {
                    this.buffer.moveCursorAbsolute({ vertical: i, horizontal: 0 });
                    this.buffer.writeString(Array(dimensions.columns).join("E"));
                }

                this.buffer.moveCursorAbsolute({ vertical: 0, horizontal: 0 });
            } else {
                status = 'unhandled';
            }
        } else {
            switch (flag) {
                case 'A':
                    short = "Cursor up.";

                    this.buffer.moveCursorRelative({ vertical: -1 });
                    break;
                case 'B':
                    short = "Cursor down.";

                    this.buffer.moveCursorRelative({ vertical: 1 });
                    break;
                case 'C':
                    short = "Cursor right.";

                    this.buffer.moveCursorRelative({ horizontal: 1 });
                    break;
                case 'D':
                    short = "Index (IND).";
                    url = "http://www.vt100.net/docs/vt510-rm/IND";

                    this.buffer.moveCursorRelative({ vertical: 1 });
                    break;
                case 'M':
                    short = "Reverse Index (RI).";
                    long = "Move the active position to the same horizontal position on the preceding line. If the active position is at the top margin, a scroll down is performed.";

                    this.buffer.moveCursorRelative({ vertical: -1 });
                    break;
                case 'E':
                    short = "Next Line (NEL).";
                    long = "This sequence causes the active position to move to the first position on the next line downward. If the active position is at the bottom margin, a scroll up is performed.";

                    this.buffer.moveCursorRelative({ vertical: 1 });
                    this.buffer.moveCursorAbsolute({ horizontal: 0 });
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
        var isSet = flag === 'h';

        //noinspection FallThroughInSwitchStatementJS
        switch (ps) {
            case 3:
                url = "http://www.vt100.net/docs/vt510-rm/DECCOLM";

                if (isSet) {
                    description = "132 Column Mode (DECCOLM).";

                    this.invocation.setDimensions({ columns: 132, rows: this.invocation.getDimensions().rows });
                } else {
                    description = "80 Column Mode (DECCOLM).";

                    this.invocation.setDimensions({ columns: 80, rows: this.invocation.getDimensions().rows });
                }
                this.buffer.clear();
                // TODO
                // If you change the DECCOLM setting, the terminal:
                //      Sets the left, right, top and bottom scrolling margins to their default positions.
                //      Erases all data in page memory.
                // DECCOLM resets vertical split screen mode (DECLRMM) to unavailable.
                // DECCOLM clears data from the status line if the status line is set to host-writable.
                break;
            case 6:
                description = "Origin Mode (DECOM).";
                url = "http://www.vt100.net/docs/vt510-rm/DECOM";

                this.invocation.getBuffer().originMode = isSet;
                break;
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

                    this.buffer.activeBuffer = e.Buffer.Alternate;
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

        var param = <number>(Array.isArray(params) ? params[0] : params);

        switch (flag) {
            case 'm':
                short = 'Some SGR stuff';

                if (params.length === 0) {
                    short = 'Reset SGR';
                    this.buffer.setAttributes(SGR[0]);
                    break;
                }

                while (params.length) {
                    var sgr = params.shift();

                    var attributeToSet = SGR[sgr];

                    if (!attributeToSet) {
                        Utils.error('sgr', sgr, params);
                    } else if (isSetColorExtended(attributeToSet)) {
                        var next = params.shift();
                        if (next === 5) {
                            var colorIndex = params.shift();
                            this.buffer.setAttributes({ [<string>attributeToSet]: e.ColorIndex[colorIndex] });
                        } else {
                            Utils.error('sgr', sgr, next, params);
                        }
                    } else if (attributeToSet === 'negative') {
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

                this.buffer.moveCursorRelative({ vertical: -(param || 1) });
                break;
            case 'B':
                short = 'Cursor Down Ps Times (default = 1) (CUD).';
                this.buffer.moveCursorRelative({ vertical: (param || 1) });
                break;
            case 'C':
                short = 'Cursor Forward Ps Times (default = 1) (CUF).';

                this.buffer.moveCursorRelative({ horizontal: (param || 1) });
                break;
            case 'D':
                short = 'Cursor Backward Ps Times (default = 1) (CUB).';

                this.buffer.moveCursorRelative({ horizontal: -(param || 1) });
                break;
            // CSI Ps E  Cursor Next Line Ps Times (default = 1) (CNL).
            // CSI Ps F  Cursor Preceding Line Ps Times (default = 1) (CPL).
            // CSI Ps G  Cursor Character Absolute  [column] (default = [row,1]) (CHA).
            case 'H':
                short = 'Cursor Position [row;column] (default = [1,1]) (CUP).';
                url = 'http://www.vt100.net/docs/vt510-rm/CUP';

                this.buffer.moveCursorAbsolute({ vertical: or1(params[0]) - 1, horizontal: or1(params[1]) - 1 });
                break;
            case 'f':
                short = 'Horizontal and Vertical Position [row;column] (default = [1,1]) (HVP).';
                url = 'http://www.vt100.net/docs/vt510-rm/HVP';

                this.buffer.moveCursorAbsolute({ vertical: or1(params[0]) - 1, horizontal: or1(params[1]) - 1 });
                break;
            case 'J':
                url = "http://www.vt100.net/docs/vt510-rm/ED";
                switch (param) {
                    case CSI.erase.entire:
                        short = "Erase Entire Display (ED).";

                        this.buffer.clear();
                        break;
                    case CSI.erase.toEnd:
                    case undefined:
                        short = "Erase Display Below (ED).";

                        this.buffer.clearToEnd();
                        break;
                    case CSI.erase.toBeginning:
                        short = "Erase Display Above (ED).";

                        this.buffer.clearToBeginning();
                        break;
                }
                break;
            case 'c':
                this.invocation.write('\x1b>1;2;');
                break;
            case 'K':
                url = "http://www.vt100.net/docs/vt510-rm/DECSEL";
                switch (param) {
                    case CSI.erase.entire:
                        short = "Erase the Line (DECSEL).";

                        this.buffer.clearRow();
                        break;
                    case CSI.erase.toEnd:
                    case undefined:
                        short = "Erase Line to Right (DECSEL).";
                        this.buffer.clearRowToEnd();
                        break;
                    case CSI.erase.toBeginning:
                        short = "Erase Line to Left (DECSEL).";
                        this.buffer.clearRowToBeginning();
                        break;
                }
                break;
            case 'L':
                url = "http://www.vt100.net/docs/vt510-rm/IL";
                short = "Inserts one or more blank lines, starting at the cursor. (DL)";

                this.buffer.scrollUp(param || 1, this.buffer.cursor.row());
                break;
            case 'M':
                url = "http://www.vt100.net/docs/vt510-rm/DL";
                short = "Deletes one or more lines in the scrolling region, starting with the line that has the cursor. (DL)";

                this.buffer.scrollDown(param || 1, this.buffer.cursor.row());
                break;
            case 'r':
                url = "http://www.vt100.net/docs/vt510-rm/DECSTBM";
                short = "Set Scrolling Region [top;bottom] (default = full size of window) (DECSTBM).";

                let bottom = <number>(params[1] ? params[1] - 1 : null);
                let top = <number>(params[0] ? params[0] - 1 : null);

                this.buffer.margins = { top: top, bottom: bottom };
                this.buffer.moveCursorAbsolute({ horizontal: 0, vertical: 0 });
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

function or1(number: number) {
    if (number === null) {
        return 1;
    } else {
        return number;
    }
}


// TODO: Move to Utils.
function logPosition(buffer: Buffer) {
    var position = buffer.cursor.getPosition();
    Utils.debug(`%crow: ${position.row}\tcolumn: ${position.column}\t value: ${buffer.at(position)}`, "color: green");
}
