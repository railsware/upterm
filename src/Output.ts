import * as events from "events";
import {attributesFlyweight, defaultAttributes, space, createChar, Char} from "./Char";
import * as i from "./Interfaces";
import * as e from "./Enums";
import {List} from "immutable";
import {Color, Weight, Brightness, KeyCode, LogLevel, OutputType} from "./Enums";
import {Attributes, TerminalLikeDevice, ColorCode} from "./Interfaces";
import {print, error, info, debug, csi, times} from "./utils/Common";

const ansiParserConstructor: typeof AnsiParser = require("node-ansiparser");

interface HandlerResult {
    status: string;
    description: string;
    longDescription?: string;
    url: string;
}

interface SavedState {
    cursorRow: number;
    cursorColumn: number;
    attributes: i.Attributes;
}

function or1(value: number | undefined) {
    if (value === undefined) {
        return 1;
    } else {
        return value;
    }
}


// TODO: Move to
function logPosition(output: Output) {
    const position = {row: output.cursorRow, column: output.cursorColumn};
    debug(`%crow: ${position.row}\tcolumn: ${output.cursorColumn}\t value: ${output.at(position)}`, "color: green");
}

/**
 * Copied from xterm.js
 * @link https://github.com/sourcelair/xterm.js/blob/master/src/Charsets.ts
 */
const graphicCharset: Dictionary<string> = {
    "`": "\u25c6", // "◆"
    "a": "\u2592", // "▒"
    "b": "\u0009", // "\t"
    "c": "\u000c", // "\f"
    "d": "\u000d", // "\r"
    "e": "\u000a", // "\n"
    "f": "\u00b0", // "°"
    "g": "\u00b1", // "±"
    "h": "\u2424", // "\u2424" (NL)
    "i": "\u000b", // "\v"
    "j": "\u2518", // "┘"
    "k": "\u2510", // "┐"
    "l": "\u250c", // "┌"
    "m": "\u2514", // "└"
    "n": "\u253c", // "┼"
    "o": "\u23ba", // "⎺"
    "p": "\u23bb", // "⎻"
    "q": "\u2500", // "─"
    "r": "\u23bc", // "⎼"
    "s": "\u23bd", // "⎽"
    "t": "\u251c", // "├"
    "u": "\u2524", // "┤"
    "v": "\u2534", // "┴"
    "w": "\u252c", // "┬"
    "x": "\u2502", // "│"
    "y": "\u2264", // "≤"
    "z": "\u2265", // "≥"
    "{": "\u03c0", // "π"
    "|": "\u2260", // "≠"
    "}": "\u00a3", // "£"
    "~": "\u00b7", // "·"
};

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

class ANSIParser {
    private parser: AnsiParser;

    constructor(private terminalDevice: TerminalLikeDevice, private output: Output) {
        this.parser = new ansiParserConstructor({
            inst_p: (text: string) => {
                info("text", text, text.split("").map(letter => letter.charCodeAt(0)));

                this.output.writeMany(text);

                logPosition(this.output);
            },
            inst_o: function (s: any) {
                error("osc", s);
            },
            inst_x: (flag: string) => {
                this.output.writeOne(flag);

                print((KeyCode[flag.charCodeAt(0)] ? LogLevel.Log : LogLevel.Error), flag.split("").map((_, index) => flag.charCodeAt(index)));
                logPosition(this.output);
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

                logPosition(this.output);
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

                logPosition(this.output);
            },
        });
    }

    parse(data: ANSIString): void {
        this.parser.parse(data);
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
                    this.output.moveCursorAbsolute({row: i, column: 0});
                    this.output.writeMany(Array(dimensions.columns).join("E"));
                }

                this.output.moveCursorAbsolute({row: 0, column: 0});
            } else if (collected === "(" && flag === "0") {
                short = "Enable Graphic Charset";

                this.output.useGraphicCharset = true;
            } else if (collected === "(" && flag === "B") {
                short = "Enable ASCII Charset";

                this.output.useGraphicCharset = false;
            } else {
                status = "unhandled";
            }
        } else {
            switch (flag) {
                case "A":
                    short = "Cursor up.";

                    this.output.moveCursorRelative({vertical: -1});
                    break;
                case "B":
                    short = "Cursor down.";

                    this.output.moveCursorRelative({vertical: 1});
                    break;
                case "C":
                    short = "Cursor right.";

                    this.output.moveCursorRelative({horizontal: 1});
                    break;
                case "D":
                    short = "Index (IND).";
                    url = "http://www.vt100.net/docs/vt510-rm/IND";

                    this.output.moveCursorRelative({vertical: 1});
                    break;
                case "M":
                    short = "Reverse Index (RI).";
                    /* tslint:disable:max-line-length */
                    long = "Move the active position to the same horizontal position on the preceding lin If the active position is at the top margin, a scroll down is performed.";

                    if (this.output.cursorRow === this.output.marginTop) {
                        this.output.scrollDown(1);
                    } else {
                        this.output.moveCursorRelative({vertical: -1});
                    }
                    break;
                case "E":
                    short = "Next Line (NEL).";
                    /* tslint:disable:max-line-length */
                    long = "This sequence causes the active position to move to the first position on the next line downward. If the active position is at the bottom margin, a scroll up is performed.";

                    this.output.moveCursorRelative({vertical: 1});
                    this.output.moveCursorAbsolute({column: 0});
                    break;
                case "7":
                    long = "Save current state (cursor coordinates, attributes, character sets pointed at by G0, G1).";
                    this.output.saveCurrentState();
                    break;
                case "8":
                    long = "Restore state most recently saved by ESC 7.";
                    this.output.restoreCurrentState();
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

                this.output.cursorKeysMode = shouldSet;
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
                this.output.clear();
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

                this.output.originMode = shouldSet;
                break;
            case 12:
                if (shouldSet) {
                    description = "Start Blinking Cursor (att610).";

                    this.output.blinkCursor(true);
                } else {
                    description = "Stop Blinking Cursor (att610).";

                    this.output.blinkCursor(false);
                }

                break;
            case 25:
                url = "http://www.vt100.net/docs/vt510-rm/DECTCEM";

                if (shouldSet) {
                    description = "Show Cursor (DECTCEM).";

                    this.output.showCursor(true);
                } else {
                    description = "Hide Cursor (DECTCEM).";

                    this.output.showCursor(false);
                }
                break;
            case 1049:
                if (shouldSet) {
                    /* tslint:disable:max-line-length */
                    description = "Save cursor as in DECSC and use Alternate Screen Buffer, clearing it first.  (This may be disabled by the titeInhibit resource).  This combines the effects of the 1047  and 1048  modes.  Use this with terminfo-based applications rather than the 47  mod";

                    this.output.activeOutputType = OutputType.Alternate;
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

                this.output.moveCursorRelative({vertical: -(param || 1)});
                break;
            case "B":
                short = "Cursor Down Ps Times (default = 1) (CUD).";
                this.output.moveCursorRelative({vertical: (param || 1)});
                break;
            case "C":
                short = "Cursor Forward Ps Times (default = 1) (CUF).";

                this.output.moveCursorRelative({horizontal: (param || 1)});
                break;
            case "D":
                short = "Cursor Backward Ps Times (default = 1) (CUB).";

                this.output.moveCursorRelative({horizontal: -(param || 1)});
                break;
            // CSI Ps E  Cursor Next Line Ps Times (default = 1) (CNL).
            // CSI Ps F  Cursor Preceding Line Ps Times (default = 1) (CPL).
            case "G":
                short = "Cursor Character Absolute [column] (default = [row,1]) (CHA)";
                url = "http://www.vt100.net/docs/vt510-rm/CHA";

                this.output.moveCursorAbsolute({column: or1(param || 1) - 1});
                break;
            case "H":
                short = "Cursor Position [row;column] (default = [1,1]) (CUP).";
                url = "http://www.vt100.net/docs/vt510-rm/CUP";

                this.output.moveCursorAbsolute({row: or1(params[0]) - 1, column: or1(params[1]) - 1});
                break;
            case "J":
                url = "http://www.vt100.net/docs/vt510-rm/ED";
                switch (param) {
                    case CSI.erase.entire:
                    case CSI.erase.entireSsh:
                        short = "Erase Entire Display (ED).";

                        this.output.clear();
                        break;
                    case CSI.erase.toEnd:
                        short = "Erase Display Below (ED).";

                        this.output.clearToEnd();
                        break;
                    case CSI.erase.toBeginning:
                        short = "Erase Display Above (ED).";

                        this.output.clearToBeginning();
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

                        this.output.clearRow();
                        break;
                    case CSI.erase.toEnd:
                        short = "Erase Line to Right (DECSEL).";
                        this.output.clearRowToEnd();
                        break;
                    case CSI.erase.toBeginning:
                        short = "Erase Line to Left (DECSEL).";
                        this.output.clearRowToBeginning();
                        break;
                    default:
                        throw `Unknown CSI erase: "${param}".`;
                }
                break;
            case "L":
                url = "http://www.vt100.net/docs/vt510-rm/IL";
                short = "Inserts one or more blank lines, starting at the cursor. (DL)";

                this.output.scrollDown(param || 1);
                break;
            case "M":
                url = "http://www.vt100.net/docs/vt510-rm/DL";
                short = "Deletes one or more lines in the scrolling region, starting with the line that has the cursor. (DL)";

                this.output.scrollUp(param || 1, this.output.cursorRow);
                break;
            case "P":
                url = "http://www.vt100.net/docs/vt510-rm/DCH.html";
                short = "Deletes one or more characters from the cursor position to the right.";

                this.output.deleteRight(param);
                break;
            case "X":
                short = "Erase P s Character(s) (default = 1) (ECH)";
                url = "http://www.vt100.net/docs/vt510-rm/ECH";

                this.output.eraseRight(param || 1);
                break;
            case "c":
                short = "Send Device Attributes (Primary DA)";
                this.terminalDevice.write("\x1b>1;2;");
                break;
            case "d":
                short = "Line Position Absolute [row] (default = [1,column]) (VPA).";
                url = "http://www.vt100.net/docs/vt510-rm/VPA";

                this.output.moveCursorAbsolute({row: or1(param || 1) - 1});
                break;
            case "f":
                short = "Horizontal and Vertical Position [row;column] (default = [1,1]) (HVP).";
                url = "http://www.vt100.net/docs/vt510-rm/HVP";

                this.output.moveCursorAbsolute({row: or1(params[0]) - 1, column: or1(params[1]) - 1});
                break;
            case "m":
                short = `SGR: ${params}`;

                if (params.length === 0) {
                    short = "Reset SGR";
                    this.output.resetAttributes();
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
                            this.output.setAttributes(attributesUpdater(this.output.attributes));
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
                    this.terminalDevice.write(csi(`${this.output.cursorRow + 1};${this.output.cursorColumn + 1}R`));
                } else {
                    status = "unhandled";
                }

                break;
            case "r":
                url = "http://www.vt100.net/docs/vt510-rm/DECSTBM";
                short = "Set Scrolling Region [top;bottom] (default = full size of window) (DECSTBM).";

                let bottom = <number>(params[1] ? params[1] - 1 : undefined);
                let top = <number>(params[0] ? params[0] - 1 : undefined);

                this.output.margins = {top: top, bottom: bottom};
                this.output.moveCursorAbsolute({row: 0, column: 0});
                break;
            case "@":
                url = "http://www.vt100.net/docs/vt510-rm/ICH.html";
                short = "Inserts one or more space (SP) characters starting at the cursor position.";

                this.output.insertSpaceRight(param);
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

    private setColor(sgr: number, color: ColorCode): void {
        if (sgr === 38) {
            this.output.setAttributes({...this.output.attributes, color: color});
        } else {
            this.output.setAttributes({...this.output.attributes, backgroundColor: color});
        }
    }
}

export class Output extends events.EventEmitter {
    public static hugeOutputThreshold = 300;
    public cursorRow = 0;
    public cursorColumn = 0;
    public _showCursor = true;
    public _blinkCursor = true;
    public activeOutputType = e.OutputType.Standard;
    public storage = List<List<Char>>();
    public useGraphicCharset = false;
    private _attributes: i.Attributes = {...defaultAttributes, color: e.Color.White, weight: e.Weight.Normal};
    private isOriginModeSet = false;
    private isCursorKeysModeSet = false;
    private _margins: Margins = {top: 0, left: 0};
    private savedState: SavedState | undefined;
    private parser: ANSIParser;

    constructor(terminalDevice: TerminalLikeDevice) {
        super();
        this.parser = new ANSIParser(terminalDevice, this);
    }

    write(ansiString: ANSIString) {
        this.parser.parse(ansiString);
    }

    writeMany(value: string): void {
        for (let i = 0; i !== value.length; ++i) {
            this.writeOne(value.charAt(i));
        }
    }

    writeOne(char: string): void {
        const charFromCharset = this.useGraphicCharset ? graphicCharset[char] : char;
        const charObject = createChar(charFromCharset, this.attributes);
        const charCode = charFromCharset.charCodeAt(0);

        /**
         * Is a special symbol.
         * @link http://www.asciitable.com/index/asciifull.gif
         */
        if (charCode < 32) {
            switch (charCode) {
                case e.KeyCode.Bell:
                    break;
                case e.KeyCode.Backspace:
                    this.moveCursorRelative({horizontal: -1});
                    break;
                case e.KeyCode.Tab:
                    this.moveCursorAbsolute({column: Math.floor((this.cursorColumn + 8) / 8) * 8});
                    break;
                case e.KeyCode.NewLine:
                    if (this.cursorRow === this._margins.bottom) {
                        this.scrollUp(1);
                    } else {
                        this.moveCursorRelative({vertical: 1});
                    }

                    break;
                case e.KeyCode.CarriageReturn:
                    this.moveCursorAbsolute({column: 0});
                    break;
                default:
                    error(`Couldn't write a special char "${charObject}".`);
            }
        } else {
            this.set(charObject);
            this.moveCursorRelative({horizontal: 1});
        }
        this.emitData();
    }

    scrollDown(count: number) {
        this.storage = this.storage.splice((this._margins.bottom || 0) - count + 1, count).toList();
        times(count, () => this.storage = this.storage.splice(this.cursorRow, 0, undefined).toList());
    }

    scrollUp(count: number, deletedLine = this._margins.top) {
        times(count, () => this.storage = this.storage.splice((this._margins.bottom || 0) + 1, 0, undefined).toList());
        this.storage = this.storage.splice(deletedLine, count).toList();
    }

    get attributes(): i.Attributes {
        return this._attributes;
    }

    resetAttributes(): void {
        this._attributes = defaultAttributes;
    }

    setAttributes(attributes: i.Attributes): void {
        this._attributes = attributesFlyweight({...this._attributes, ...attributes});
    }

    toLines(): string[] {
        return this.storage.map(row => {
            if (row) {
                return row.map(char => {
                    if (char) {
                        return char.value;
                    } else {
                        return " ";
                    }
                }).join("");
            } else {
                return "";
            }
        }).toArray();
    }

    toString(): string {
        return this.toLines().join("\n");
    }

    showCursor(state: boolean): void {
        this.ensureRowExists(this.cursorRow);
        this._showCursor = state;
        this.emitData();
    }

    blinkCursor(state: boolean): void {
        this.ensureRowExists(this.cursorRow);
        this._blinkCursor = state;
        this.emitData();
    }

    moveCursorRelative(advancement: Advancement): this {
        const row = Math.max(0, this.cursorRow + (advancement.vertical || 0));
        const column = Math.max(0, this.cursorColumn + (advancement.horizontal || 0));

        this.moveCursorAbsolute({ row: row, column: column });

        this.ensureRowExists(this.cursorRow);
        this.emitData();

        return this;
    }

    moveCursorAbsolute(position: Partial<RowColumn>): this {
        if (typeof position.column === "number") {
            this.cursorColumn = Math.max(position.column, 0) + this.homePosition.column;
        }

        if (typeof position.row === "number") {
            this.cursorRow = Math.max(position.row, 0) + this.homePosition.row;
        }

        this.ensureRowExists(this.cursorRow);
        this.emitData();

        return this;
    }

    deleteRight(n: number) {
        if (this.storage.get(this.cursorRow)) {
            this.storage = this.storage.update(
                this.cursorRow,
                List<Char>(),
                (row: List<Char>) => row.splice(this.cursorColumn, n).toList(),
            );
        }
        this.emitData();
    }

    insertSpaceRight(n: number) {
        if (this.storage.get(this.cursorRow)) {
            let nSpace = "";
            for (let i = 0; i < n; i++) { nSpace += " "; }
            this.storage = this.storage.update(
                this.cursorRow,
                List<Char>(),
                (row: List<Char>) => row.splice(this.cursorColumn, 0, nSpace).toList(),
            );
        }
        this.emitData();
    }

    eraseRight(n: number) {
        if (this.storage.get(this.cursorRow)) {
            this.storage = this.storage.update(
                this.cursorRow,
                List<Char>(),
                (row: List<Char>) => row.take(this.cursorColumn)
                    .concat(Array(n).fill(space), row.skip(this.cursorColumn + n))
                    .toList(),
            );
        }
        this.emitData();
    }

    clearRow() {
        this.storage = this.storage.set(this.cursorRow, List<Char>());
        this.emitData();
    }

    clearRowToEnd() {
        if (this.storage.get(this.cursorRow)) {
            this.storage = this.storage.update(
                this.cursorRow,
                List<Char>(),
                (row: List<Char>) => row.take(this.cursorColumn).toList(),
            );
        }
        this.emitData();
    }

    clearRowToBeginning() {
        if (this.storage.get(this.cursorRow)) {
            const replacement = Array(this.cursorColumn).fill(space);
            this.storage = this.storage.update(
                this.cursorRow,
                row => row.splice(0, this.cursorColumn + 1, ...replacement).toList());
        }
        this.emitData();
    }

    clear() {
        this.storage = List<List<Char>>();
        this.moveCursorAbsolute({row: 0, column: 0});
    }

    clearToBeginning() {
        this.clearRowToBeginning();
        const replacement = Array(this.cursorRow);

        this.storage = this.storage.splice(0, this.cursorRow, ...replacement).toList();
        this.emitData();
    }

    clearToEnd() {
        this.clearRowToEnd();
        this.storage = this.storage.splice(this.cursorRow + 1, this.storage.size - this.cursorRow).toList();
        this.emitData();
    }

    get size(): number {
        return this.storage.size;
    }

    isEmpty(): boolean {
        return this.storage.size === 0;
    }

    set originMode(mode: boolean) {
        this.isOriginModeSet = mode;
    }

    set cursorKeysMode(mode: boolean) {
        this.isCursorKeysModeSet = mode;
    }

    get cursorKeysMode(): boolean {
        return this.isCursorKeysModeSet;
    }

    set margins(margins: Partial<Margins>) {
        this._margins = {...this._margins, ...margins};
    }

    get marginTop(): number {
        return this._margins.top;
    }

    at(position: RowColumn): Char {
        return this.storage.getIn([position.row, position.column]);
    }

    saveCurrentState() {
        this.savedState = {
            cursorRow: this.cursorRow,
            cursorColumn: this.cursorColumn,
            attributes: {...this.attributes},
        };
    }

    restoreCurrentState() {
        if (this.savedState) {
            this.moveCursorAbsolute({row: this.savedState.cursorRow, column: this.savedState.cursorColumn});
            this.setAttributes(this.savedState.attributes);
        } else {
            console.error("No state to restore.");
        }
    }

    private get homePosition(): RowColumn {
        if (this.isOriginModeSet) {
            return {row: this._margins.top || 0, column: this._margins.left || 0};
        } else {
            return {row: 0, column: 0};
        }
    }

    private set(char: Char): void {
        this.ensureRowExists(this.cursorRow);
        this.storage = this.storage.setIn([this.cursorRow, this.cursorColumn], char);
    }

    private ensureRowExists(rowNumber: number): void {
        if (!this.storage.get(rowNumber)) {
            this.storage = this.storage.set(rowNumber, List<Char>());
        }
    }

    private emitData() {
        this.emit("data");
    }
}
