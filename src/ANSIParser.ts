import {Char, defaultAttributes} from "./Char";
import {Color, Weight, Brightness, KeyCode, LogLevel, ScreenBufferType} from "./Enums";
import {Attributes, TerminalLikeDevice, ColorCode} from "./Interfaces";
import {ScreenBuffer} from "./ScreenBuffer";
import {print, error, info, debug, csi} from "./utils/Common";

const ansiParserConstructor: typeof AnsiParser = require("node-ansiparser");

interface HandlerResult {
    status: string;
    description: string;
    longDescription?: string;
    url: string;
}

const SGR: { [indexer: string]: (attributes: Attributes) => Attributes } = {
    0: (_attributes: Attributes) => defaultAttributes,
    1: (attributes: Attributes) => ({...attributes, brightness: Brightness.Bright}),
    2: (attributes: Attributes) => ({...attributes, weight: Weight.Faint}),
    4: (attributes: Attributes) => ({...attributes, underline: true}),
    7: (attributes: Attributes) => ({...attributes, inverse: true}),
    22: (attributes: Attributes) => ({...attributes, weight: Weight.Normal}),
    24: (attributes: Attributes) => ({...attributes, underline: false}),
    27: (attributes: Attributes) => ({...attributes, inverse: false}),
    30: (attributes: Attributes) => ({...attributes, color: <ColorCode>Color.Black}),
    31: (attributes: Attributes) => ({...attributes, color: <ColorCode>Color.Red}),
    32: (attributes: Attributes) => ({...attributes, color: <ColorCode>Color.Green}),
    33: (attributes: Attributes) => ({...attributes, color: <ColorCode>Color.Yellow}),
    34: (attributes: Attributes) => ({...attributes, color: <ColorCode>Color.Blue}),
    35: (attributes: Attributes) => ({...attributes, color: <ColorCode>Color.Magenta}),
    36: (attributes: Attributes) => ({...attributes, color: <ColorCode>Color.Cyan}),
    37: (attributes: Attributes) => ({...attributes, color: <ColorCode>Color.White}),
    39: (attributes: Attributes) => ({...attributes, color: <ColorCode>Color.White}),
    40: (attributes: Attributes) => ({...attributes, backgroundColor: <ColorCode>Color.Black}),
    41: (attributes: Attributes) => ({...attributes, backgroundColor: <ColorCode>Color.Red}),
    42: (attributes: Attributes) => ({...attributes, backgroundColor: <ColorCode>Color.Green}),
    43: (attributes: Attributes) => ({...attributes, backgroundColor: <ColorCode>Color.Yellow}),
    44: (attributes: Attributes) => ({...attributes, backgroundColor: <ColorCode>Color.Blue}),
    45: (attributes: Attributes) => ({...attributes, backgroundColor: <ColorCode>Color.Magenta}),
    46: (attributes: Attributes) => ({...attributes, backgroundColor: <ColorCode>Color.Cyan}),
    47: (attributes: Attributes) => ({...attributes, backgroundColor: <ColorCode>Color.White}),
    49: (attributes: Attributes) => ({...attributes, backgroundColor: <ColorCode>Color.Black}),
    90: (attributes: Attributes) => ({...attributes, brightness: Brightness.Bright, color: <ColorCode>Color.Black}),
    91: (attributes: Attributes) => ({...attributes, brightness: Brightness.Bright, color: <ColorCode>Color.Red}),
    92: (attributes: Attributes) => ({...attributes, brightness: Brightness.Bright, color: <ColorCode>Color.Green}),
    93: (attributes: Attributes) => ({...attributes, brightness: Brightness.Bright, color: <ColorCode>Color.Yellow}),
    94: (attributes: Attributes) => ({...attributes, brightness: Brightness.Bright, color: <ColorCode>Color.Blue}),
    95: (attributes: Attributes) => ({...attributes, brightness: Brightness.Bright, color: <ColorCode>Color.Magenta}),
    96: (attributes: Attributes) => ({...attributes, brightness: Brightness.Bright, color: <ColorCode>Color.Cyan}),
    97: (attributes: Attributes) => ({...attributes, brightness: Brightness.Bright, color: <ColorCode>Color.White}),
    100: (attributes: Attributes) => ({...attributes, brightness: Brightness.Bright, backgroundColor: <ColorCode>Color.Black}),
    101: (attributes: Attributes) => ({...attributes, brightness: Brightness.Bright, backgroundColor: <ColorCode>Color.Red}),
    102: (attributes: Attributes) => ({...attributes, brightness: Brightness.Bright, backgroundColor: <ColorCode>Color.Green}),
    103: (attributes: Attributes) => ({...attributes, brightness: Brightness.Bright, backgroundColor: <ColorCode>Color.Yellow}),
    104: (attributes: Attributes) => ({...attributes, brightness: Brightness.Bright, backgroundColor: <ColorCode>Color.Blue}),
    105: (attributes: Attributes) => ({...attributes, brightness: Brightness.Bright, backgroundColor: <ColorCode>Color.Magenta}),
    106: (attributes: Attributes) => ({...attributes, brightness: Brightness.Bright, backgroundColor: <ColorCode>Color.Cyan}),
    107: (attributes: Attributes) => ({...attributes, brightness: Brightness.Bright, backgroundColor: <ColorCode>Color.White}),
};

const CSI = {
    erase: {
        toEnd: 0,
        toBeginning: 1,
        entire: 2,
        entireSsh: 3,
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

                    if (this.screenBuffer.cursorRow === this.screenBuffer.marginTop) {
                        this.screenBuffer.scrollDown(1);
                    } else {
                        this.screenBuffer.moveCursorRelative({vertical: -1});
                    }
                    break;
                case "E":
                    short = "Next Line (NEL).";
                    /* tslint:disable:max-line-length */
                    long = "This sequence causes the active position to move to the first position on the next line downward. If the active position is at the bottom margin, a scroll up is performed.";

                    this.screenBuffer.moveCursorRelative({vertical: 1});
                    this.screenBuffer.moveCursorAbsolute({column: 0});
                    break;
                case "7":
                    long = "Save current state (cursor coordinates, attributes, character sets pointed at by G0, G1).";
                    this.screenBuffer.saveCurrentState();
                    break;
                case "8":
                    long = "Restore state most recently saved by ESC 7.";
                    this.screenBuffer.restoreCurrentState();
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

                this.screenBuffer.cursorKeysMode = shouldSet;
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

    private csiHandler(_collected: any, rawParams: number[] | number, flag: string): HandlerResult {
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
                    case CSI.erase.entireSsh:
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

                this.screenBuffer.scrollDown(param || 1);
                break;
            case "M":
                url = "http://www.vt100.net/docs/vt510-rm/DL";
                short = "Deletes one or more lines in the scrolling region, starting with the line that has the cursor. (DL)";

                this.screenBuffer.scrollUp(param || 1, this.screenBuffer.cursorRow);
                break;
            case "P":
                url = "http://www.vt100.net/docs/vt510-rm/DCH.html";
                short = "Deletes one or more characters from the cursor position to the right.";

                this.screenBuffer.deleteRight(param);
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
                    this.screenBuffer.resetAttributes();
                    break;
                }

                while (params.length !== 0) {
                    const sgr = params.shift()!;

                    if (sgr === 38 || sgr === 48) {
                        const colorFormat = params.shift();

                        if (colorFormat === colorFormatCodes.format8bit) {
                            const color = params.shift();

                            if (color) {
                                this.setColor(sgr, color);
                            } else {
                                error("sgr", sgr, colorFormat, params);
                            }
                        } else if (colorFormat === colorFormatCodes.formatTrueColor) {
                            this.setColor(sgr, params);
                            params = [];
                        } else {
                            error("sgr", sgr, colorFormat, params);
                        }
                    } else {
                        const attributesUpdater = SGR[sgr];

                        if (attributesUpdater) {
                            this.screenBuffer.setAttributes(attributesUpdater(this.screenBuffer.attributes));
                        } else {
                            error("sgr", sgr, params);
                        }
                    }
                }

                break;
            case "n":
                if (param === 6) {
                    url = "http://www.vt100.net/docs/vt510-rm/CPR";
                    short = "Report Cursor Position (CPR) [row;column] as CSI r ; c R";
                    this.terminalDevice.write(csi(`${this.screenBuffer.cursorRow + 1};${this.screenBuffer.cursorRow + 1}R`));
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
            case "@":
                url = "http://www.vt100.net/docs/vt510-rm/ICH.html";
                short = "Inserts one or more space (SP) characters starting at the cursor position.";

                this.screenBuffer.insertSpaceRight(param);
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

    private setColor(sgr: number, color: ColorCode): void {
        if (sgr === 38) {
            this.screenBuffer.setAttributes({...this.screenBuffer.attributes, color: color});
        } else {
            this.screenBuffer.setAttributes({...this.screenBuffer.attributes, backgroundColor: color});
        }
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
    const position = {row: buffer.cursorRow, column: buffer.cursorColumn};
    debug(`%crow: ${position.row}\tcolumn: ${buffer.cursorColumn}\t value: ${buffer.at(position)}`, "color: green");
}
