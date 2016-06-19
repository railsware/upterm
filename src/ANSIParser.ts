import {Char} from "./Char";
import {Color, Weight, Brightness, KeyCode, LogLevel, ScreenBufferType} from "./Enums";
import {Attributes, TerminalLikeDevice} from "./Interfaces";
import {ScreenBuffer} from "./ScreenBuffer";
import {print, error, info, debug} from "./utils/Common";

const ansiParserConstructor: typeof AnsiParser = require("node-ansiparser");

interface HandlerResult {
    status: string;
    description: string;
    longDescription?: string;
    url: string;
}

const SGR: { [indexer: string]: Attributes|string } = {
    0: {color: Color.White, weight: Weight.Normal, underline: false, backgroundColor: Color.Black, inverse: false},
    1: {brightness: Brightness.Bright},
    2: {weight: Weight.Faint},
    4: {underline: true},
    7: {inverse: true},
    27: {inverse: false},
    30: {color: Color.Black},
    31: {color: Color.Red},
    32: {color: Color.Green},
    33: {color: Color.Yellow},
    34: {color: Color.Blue},
    35: {color: Color.Magenta},
    36: {color: Color.Cyan},
    37: {color: Color.White},
    38: "color",
    39: {color: Color.White},
    40: {backgroundColor: Color.Black},
    41: {backgroundColor: Color.Red},
    42: {backgroundColor: Color.Green},
    43: {backgroundColor: Color.Yellow},
    44: {backgroundColor: Color.Blue},
    45: {backgroundColor: Color.Magenta},
    46: {backgroundColor: Color.Cyan},
    47: {backgroundColor: Color.White},
    48: "backgroundColor",
    49: {backgroundColor: Color.Black},
    90: {brightness: Brightness.Bright, color: Color.Black},
    91: {brightness: Brightness.Bright, color: Color.Red},
    92: {brightness: Brightness.Bright, color: Color.Green},
    93: {brightness: Brightness.Bright, color: Color.Yellow},
    94: {brightness: Brightness.Bright, color: Color.Blue},
    95: {brightness: Brightness.Bright, color: Color.Magenta},
    96: {brightness: Brightness.Bright, color: Color.Cyan},
    97: {brightness: Brightness.Bright, color: Color.White},
    100: {brightness: Brightness.Bright, backgroundColor: Color.Black},
    101: {brightness: Brightness.Bright, backgroundColor: Color.Red},
    102: {brightness: Brightness.Bright, backgroundColor: Color.Green},
    103: {brightness: Brightness.Bright, backgroundColor: Color.Yellow},
    104: {brightness: Brightness.Bright, backgroundColor: Color.Blue},
    105: {brightness: Brightness.Bright, backgroundColor: Color.Magenta},
    106: {brightness: Brightness.Bright, backgroundColor: Color.Cyan},
    107: {brightness: Brightness.Bright, backgroundColor: Color.White},
};

function isSetColorExtended(sgrValue: any): sgrValue is string {
    return sgrValue === "color" || sgrValue === "backgroundColor";
}

const CSI = {
    erase: {
        toEnd: 0,
        toBeginning: 1,
        entire: 2,
    },
};

const colorFormatCodes = {
    format8bit: 5,
    formatTrueColor: 2,
};

export class ANSIParser {
    private parser: AnsiParser;

    constructor(private terminalDevice: TerminalLikeDevice) {
        this.parser = this.initializeAnsiParser();
    }

    parse(data: string): void {
        this.parser.parse(data);
    }

    private initializeAnsiParser(): AnsiParser {
        // TODO: The parser is a mess, but I tried to make it
        // TODO: an easy to clean up mess.
        return new ansiParserConstructor({
            inst_p: (text: string) => {
                info("text", text, text.split("").map(letter => letter.charCodeAt(0)));

                this.screenBuffer.writeMany(text);

                logPosition(this.screenBuffer);
            },
            inst_o: function (s: any) {
                error("osc", s);
            },
            inst_x: (flag: string) => {
                const char = Char.flyweight(flag, this.terminalDevice.screenBuffer.attributes);
                const name = KeyCode[char.keyCode];

                print((name ? LogLevel.Log : LogLevel.Error), flag.split("").map((_, index) => flag.charCodeAt(index)));

                this.screenBuffer.writeOne(flag);

                logPosition(this.screenBuffer);
            },
            /**
             * CSI handler.
             */
            inst_c: (collected: any, params: Array<number>, flag: string) => {
                let handlerResult: HandlerResult;
                if (collected === "?") {
                    if (params.length !== 1) {
                        return error(`CSI private mode has ${params.length} parameters: ${params}`);
                    }
                    if (flag !== "h" && flag !== "l") {
                        return error(`CSI private mode has an incorrect flag: ${flag}`);
                    }
                    const mode = params[0];
                    handlerResult = this.decPrivateModeHandler(mode, flag);

                    if (handlerResult.status === "handled") {
                        info(`%cCSI ? ${mode} ${flag}`, "color: blue", handlerResult.description, handlerResult.url);
                    } else {
                        error(`%cCSI ? ${mode} ${flag}`, "color: blue", handlerResult.description, handlerResult.url);
                    }
                } else {
                    handlerResult = this.csiHandler(collected, params, flag);

                    if (handlerResult.status === "handled") {
                        info(`%cCSI ${params} ${flag}`, "color: blue", handlerResult.description, handlerResult.url);
                    } else {
                        error(`%cCSI ${params} ${flag}`, "color: blue", handlerResult.description, handlerResult.url);
                    }
                }

                logPosition(this.screenBuffer);
            },
            /**
             * ESC handler.
             */
            inst_e: (collected: any, flag: string) => {
                const handlerResult = this.escapeHandler(collected, flag);

                if (handlerResult.status === "handled") {
                    info(`%cESC ${collected} ${flag}`, "color: blue", handlerResult.description, handlerResult.url);
                } else {
                    error(`%cESC ${collected} ${flag}`, "color: blue", handlerResult.description, handlerResult.url);
                }

                logPosition(this.screenBuffer);
            },
        });
    }

    private escapeHandler(collected: any, flag: string) {
        let short = "";
        let long = "";
        let url = "";
        let status = "handled";

        if (collected) {
            if (collected === "#" && flag === "8") {
                short = "DEC Screen Alignment Test (DECALN).";
                url = "http://www.vt100.net/docs/vt510-rm/DECALN";

                const dimensions = this.terminalDevice.dimensions;

                for (let i = 0; i !== dimensions.rows; ++i) {
                    this.screenBuffer.moveCursorAbsolute({row: i, column: 0});
                    this.screenBuffer.writeMany(Array(dimensions.columns).join("E"));
                }

                this.screenBuffer.moveCursorAbsolute({row: 0, column: 0});
            } else {
                status = "unhandled";
            }
        } else {
            switch (flag) {
                case "A":
                    short = "Cursor up.";

                    this.screenBuffer.moveCursorRelative({vertical: -1});
                    break;
                case "B":
                    short = "Cursor down.";

                    this.screenBuffer.moveCursorRelative({vertical: 1});
                    break;
                case "C":
                    short = "Cursor right.";

                    this.screenBuffer.moveCursorRelative({horizontal: 1});
                    break;
                case "D":
                    short = "Index (IND).";
                    url = "http://www.vt100.net/docs/vt510-rm/IND";

                    this.screenBuffer.moveCursorRelative({vertical: 1});
                    break;
                case "M":
                    short = "Reverse Index (RI).";
                    /* tslint:disable:max-line-length */
                    long = "Move the active position to the same horizontal position on the preceding lin If the active position is at the top margin, a scroll down is performed.";

                    this.screenBuffer.moveCursorRelative({vertical: -1});
                    break;
                case "E":
                    short = "Next Line (NEL).";
                    /* tslint:disable:max-line-length */
                    long = "This sequence causes the active position to move to the first position on the next line downward. If the active position is at the bottom margin, a scroll up is performed.";

                    this.screenBuffer.moveCursorRelative({vertical: 1});
                    this.screenBuffer.moveCursorAbsolute({column: 0});
                    break;
                default:
                    status = "unhandled";
            }
        }

        return {
            status: status,
            description: short,
            longDescription: long,
            url: url,
        };
    }

    private decPrivateModeHandler(ps: number, flag: string): HandlerResult {
        let description = "";
        let url = "";
        let status: "handled" | "unhandled" = "handled";
        let shouldSet = flag === "h";

        // noinspection FallThroughInSwitchStatementJS
        switch (ps) {
            case 1:
                description = "Cursor Keys Mode.";
                url = "http://www.vt100.net/docs/vt510-rm/DECCKM";
                status = "unhandled";
                break;
            case 3:
                url = "http://www.vt100.net/docs/vt510-rm/DECCOLM";

                if (shouldSet) {
                    description = "132 Column Mode (DECCOLM).";

                    this.terminalDevice.dimensions = {columns: 132, rows: this.terminalDevice.dimensions.rows};
                } else {
                    description = "80 Column Mode (DECCOLM).";

                    this.terminalDevice.dimensions = {columns: 80, rows: this.terminalDevice.dimensions.rows};
                }
                this.screenBuffer.clear();
                // TODO
                // If you change the DECCOLM setting, the terminal:
                //      Sets the left, right, top and bottom scrolling margins to their default positions.
                //      Erases all data in page memory.
                // DECCOLM resets vertical split screen mode (DECLRMM) to unavailabl
                // DECCOLM clears data from the status line if the status line is set to host-writabl
                break;
            case 6:
                description = "Origin Mode (DECOM).";
                url = "http://www.vt100.net/docs/vt510-rm/DECOM";

                this.screenBuffer.originMode = shouldSet;
                break;
            case 12:
                if (shouldSet) {
                    description = "Start Blinking Cursor (att610).";

                    this.screenBuffer.blinkCursor(true);
                } else {
                    description = "Stop Blinking Cursor (att610).";

                    this.screenBuffer.blinkCursor(false);
                }

                break;
            case 25:
                url = "http://www.vt100.net/docs/vt510-rm/DECTCEM";

                if (shouldSet) {
                    description = "Show Cursor (DECTCEM).";

                    this.screenBuffer.showCursor(true);
                } else {
                    description = "Hide Cursor (DECTCEM).";

                    this.screenBuffer.showCursor(false);
                }
                break;
            case 1049:
                if (shouldSet) {
                    /* tslint:disable:max-line-length */
                    description = "Save cursor as in DECSC and use Alternate Screen Buffer, clearing it first.  (This may be disabled by the titeInhibit resource).  This combines the effects of the 1047  and 1048  modes.  Use this with terminfo-based applications rather than the 47  mod";

                    this.screenBuffer.activeScreenBufferType = ScreenBufferType.Alternate;
                } else {
                    // TODO: Add Implementation
                    status = "unhandled";
                }
                break;
            case 2004:
                if (shouldSet) {
                    description = "Set bracketed paste mod";
                } else {
                    // TODO: Add Implementation
                    status = "unhandled";
                }
                break;
            default:
                status = "unhandled";
        }

        return {
            status: status,
            description: description,
            url: url,
        };
    }

    private csiHandler(collected: any, rawParams: number[] | number, flag: string): HandlerResult {
        let short = "";
        let long = "";
        let url = "";
        let status = "handled";

        let params: number[] = Array.isArray(rawParams) ? rawParams : [];
        const param: number = params[0] || 0;

        switch (flag) {
            case "A":
                short = "Cursor Up Ps Times (default = 1) (CUU).";

                this.screenBuffer.moveCursorRelative({vertical: -(param || 1)});
                break;
            case "B":
                short = "Cursor Down Ps Times (default = 1) (CUD).";
                this.screenBuffer.moveCursorRelative({vertical: (param || 1)});
                break;
            case "C":
                short = "Cursor Forward Ps Times (default = 1) (CUF).";

                this.screenBuffer.moveCursorRelative({horizontal: (param || 1)});
                break;
            case "D":
                short = "Cursor Backward Ps Times (default = 1) (CUB).";

                this.screenBuffer.moveCursorRelative({horizontal: -(param || 1)});
                break;
            // CSI Ps E  Cursor Next Line Ps Times (default = 1) (CNL).
            // CSI Ps F  Cursor Preceding Line Ps Times (default = 1) (CPL).
            case "G":
                short = "Cursor Character Absolute [column] (default = [row,1]) (CHA)";
                url = "http://www.vt100.net/docs/vt510-rm/CHA";

                this.screenBuffer.moveCursorAbsolute({column: or1(param || 1) - 1});
                break;
            case "H":
                short = "Cursor Position [row;column] (default = [1,1]) (CUP).";
                url = "http://www.vt100.net/docs/vt510-rm/CUP";

                this.screenBuffer.moveCursorAbsolute({row: or1(params[0]) - 1, column: or1(params[1]) - 1});
                break;
            case "J":
                url = "http://www.vt100.net/docs/vt510-rm/ED";
                switch (param) {
                    case CSI.erase.entire:
                        short = "Erase Entire Display (ED).";

                        this.screenBuffer.clear();
                        break;
                    case CSI.erase.toEnd:
                        short = "Erase Display Below (ED).";

                        this.screenBuffer.clearToEnd();
                        break;
                    case CSI.erase.toBeginning:
                        short = "Erase Display Above (ED).";

                        this.screenBuffer.clearToBeginning();
                        break;
                    default:
                        throw `Unknown CSI erase: "${param}".`;
                }
                break;
            case "K":
                url = "http://www.vt100.net/docs/vt510-rm/DECSEL";
                switch (param) {
                    case CSI.erase.entire:
                        short = "Erase the Line (DECSEL).";

                        this.screenBuffer.clearRow();
                        break;
                    case CSI.erase.toEnd:
                        short = "Erase Line to Right (DECSEL).";
                        this.screenBuffer.clearRowToEnd();
                        break;
                    case CSI.erase.toBeginning:
                        short = "Erase Line to Left (DECSEL).";
                        this.screenBuffer.clearRowToBeginning();
                        break;
                    default:
                        throw `Unknown CSI erase: "${param}".`;
                }
                break;
            case "L":
                url = "http://www.vt100.net/docs/vt510-rm/IL";
                short = "Inserts one or more blank lines, starting at the cursor. (DL)";

                this.screenBuffer.scrollUp(param || 1, this.screenBuffer.cursor.row);
                break;
            case "M":
                url = "http://www.vt100.net/docs/vt510-rm/DL";
                short = "Deletes one or more lines in the scrolling region, starting with the line that has the cursor. (DL)";

                this.screenBuffer.scrollDown(param || 1, this.screenBuffer.cursor.row);
                break;
            case "X":
                short = "Erase P s Character(s) (default = 1) (ECH)";
                url = "http://www.vt100.net/docs/vt510-rm/ECH";

                this.screenBuffer.eraseRight(param || 1);
                break;
            case "c":
                short = "Send Device Attributes (Primary DA)";
                this.terminalDevice.write("\x1b>1;2;");
                break;
            case "d":
                short = "Line Position Absolute [row] (default = [1,column]) (VPA).";
                url = "http://www.vt100.net/docs/vt510-rm/VPA";

                this.screenBuffer.moveCursorAbsolute({row: or1(param || 1) - 1});
                break;
            case "f":
                short = "Horizontal and Vertical Position [row;column] (default = [1,1]) (HVP).";
                url = "http://www.vt100.net/docs/vt510-rm/HVP";

                this.screenBuffer.moveCursorAbsolute({row: or1(params[0]) - 1, column: or1(params[1]) - 1});
                break;
            case "m":
                short = `SGR: ${params}`;

                if (params.length === 0) {
                    short = "Reset SGR";
                    this.screenBuffer.setAttributes(SGR[0]);
                    break;
                }

                while (params.length !== 0) {
                    const sgr = params.shift()!;
                    const attributeToSet = SGR[sgr];

                    if (!attributeToSet) {
                        error("sgr", sgr, params);
                    } else if (isSetColorExtended(attributeToSet)) {
                        const colorFormat = params.shift();
                        if (colorFormat === colorFormatCodes.format8bit) {
                            const color = params.shift();

                            if (color) {
                                this.screenBuffer.setAttributes({[attributeToSet]: color});
                            } else {
                                error("sgr", sgr, colorFormat, params);
                            }
                        } else if (colorFormat === colorFormatCodes.formatTrueColor) {
                            this.screenBuffer.setAttributes({[attributeToSet]: params});
                            params = [];
                        } else {
                            error("sgr", sgr, colorFormat, params);
                        }
                    } else {
                        this.screenBuffer.setAttributes(attributeToSet);
                    }
                }
                break;
            case "n":
                if (param === 6) {
                    url = "http://www.vt100.net/docs/vt510-rm/CPR";
                    short = "Report Cursor Position (CPR) [row;column] as CSI r ; c R";
                    const {row, column} = this.screenBuffer.cursorPosition;
                    this.terminalDevice.write(`\x1b[${row + 1};${column + 1}R`);
                } else {
                    status = "unhandled";
                }

                break;
            case "r":
                url = "http://www.vt100.net/docs/vt510-rm/DECSTBM";
                short = "Set Scrolling Region [top;bottom] (default = full size of window) (DECSTBM).";

                let bottom = <number>(params[1] ? params[1] - 1 : undefined);
                let top = <number>(params[0] ? params[0] - 1 : undefined);

                this.screenBuffer.margins = {top: top, bottom: bottom};
                this.screenBuffer.moveCursorAbsolute({row: 0, column: 0});
                break;
            default:
                status = "unhandled";
        }

        return {
            status: status,
            description: short,
            longDescription: long,
            url: url,
        };
    }

    private get screenBuffer() {
        return this.terminalDevice.screenBuffer;
    }
}

function or1(value: number | undefined) {
    if (value === undefined) {
        return 1;
    } else {
        return value;
    }
}


// TODO: Move to
function logPosition(buffer: ScreenBuffer) {
    const position = buffer.cursor.getPosition();
    debug(`%crow: ${position.row}\tcolumn: ${position.column}\t value: ${buffer.at(position)}`, "color: green");
}
