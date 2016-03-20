import Job from "./Job";
import Char from "./Char";
import {Color, Weight, Brightness, KeyCode, LogLevel, Buffer, colorIndex} from "./Enums";
import {Attributes} from "./Interfaces";
import BufferModel from "./Buffer";
import {print, error, info, debug} from "./Utils";

const ansiParserConstructor: typeof AnsiParser = require("node-ansiparser");


interface HandlerResult {
    status: string;
    description: string;
    longDescription?: string;
    url: string;
}

const SGR: { [indexer: string]: Attributes|string } = {
    0: {color: Color.White, weight: Weight.Normal, underline: false, "background-color": Color.Black, inverse: false},
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
    40: {"background-color": Color.Black},
    41: {"background-color": Color.Red},
    42: {"background-color": Color.Green},
    43: {"background-color": Color.Yellow},
    44: {"background-color": Color.Blue},
    45: {"background-color": Color.Magenta},
    46: {"background-color": Color.Cyan},
    47: {"background-color": Color.White},
    48: "background-color",
    49: {"background-color": Color.Black},
};

function isSetColorExtended(sgrValue: any) {
    return sgrValue === "color" || sgrValue === "background-color";
}

const CSI = {
    erase: {
        toEnd: 0,
        toBeginning: 1,
        entire: 2,
    },
};

export default class Parser {
    private parser: AnsiParser;
    private buffer: BufferModel;

    constructor(private job: Job) {
        this.buffer = this.job.buffer;
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

                this.buffer.writeMany(text);

                logPosition(this.buffer);
            },
            inst_o: function (s: any) {
                error("osc", s);
            },
            inst_x: (flag: string) => {
                const char = Char.flyweight(flag, this.job.buffer.attributes);
                const name = KeyCode[char.keyCode];

                print((name ? LogLevel.Log : LogLevel.Error), flag.split("").map((_, index) => flag.charCodeAt(index)));

                this.buffer.writeOne(flag);

                logPosition(this.buffer);
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

                logPosition(this.buffer);
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

                logPosition(this.buffer);
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

                const dimensions = this.job.getDimensions();

                for (let i = 0; i !== dimensions.rows; ++i) {
                    this.buffer.moveCursorAbsolute({row: i, column: 0});
                    this.buffer.writeMany(Array(dimensions.columns).join("E"));
                }

                this.buffer.moveCursorAbsolute({row: 0, column: 0});
            } else {
                status = "unhandled";
            }
        } else {
            switch (flag) {
                case "A":
                    short = "Cursor up.";

                    this.buffer.moveCursorRelative({vertical: -1});
                    break;
                case "B":
                    short = "Cursor down.";

                    this.buffer.moveCursorRelative({vertical: 1});
                    break;
                case "C":
                    short = "Cursor right.";

                    this.buffer.moveCursorRelative({horizontal: 1});
                    break;
                case "D":
                    short = "Index (IND).";
                    url = "http://www.vt100.net/docs/vt510-rm/IND";

                    this.buffer.moveCursorRelative({vertical: 1});
                    break;
                case "M":
                    short = "Reverse Index (RI).";
                    /* tslint:disable:max-line-length */
                    long = "Move the active position to the same horizontal position on the preceding lin If the active position is at the top margin, a scroll down is performed.";

                    this.buffer.moveCursorRelative({vertical: -1});
                    break;
                case "E":
                    short = "Next Line (NEL).";
                    /* tslint:disable:max-line-length */
                    long = "This sequence causes the active position to move to the first position on the next line downward. If the active position is at the bottom margin, a scroll up is performed.";

                    this.buffer.moveCursorRelative({vertical: 1});
                    this.buffer.moveCursorAbsolute({column: 0});
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

                    this.job.setDimensions({columns: 132, rows: this.job.getDimensions().rows});
                } else {
                    description = "80 Column Mode (DECCOLM).";

                    this.job.setDimensions({columns: 80, rows: this.job.getDimensions().rows});
                }
                this.buffer.clear();
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

                this.job.buffer.originMode = shouldSet;
                break;
            case 12:
                if (shouldSet) {
                    description = "Start Blinking Cursor (att610).";

                    this.buffer.blinkCursor(true);
                } else {
                    description = "Stop Blinking Cursor (att610).";

                    this.buffer.blinkCursor(false);
                }

                break;
            case 25:
                url = "http://www.vt100.net/docs/vt510-rm/DECTCEM";

                if (shouldSet) {
                    description = "Show Cursor (DECTCEM).";

                    this.buffer.showCursor(true);
                } else {
                    description = "Hide Cursor (DECTCEM).";

                    this.buffer.showCursor(false);
                }
                break;
            case 1049:
                if (shouldSet) {
                    /* tslint:disable:max-line-length */
                    description = "Save cursor as in DECSC and use Alternate Screen Buffer, clearing it first.  (This may be disabled by the titeInhibit resource).  This combines the effects of the 1047  and 1048  modes.  Use this with terminfo-based applications rather than the 47  mod";

                    this.buffer.activeBuffer = Buffer.Alternate;
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

    private csiHandler(collected: any, params: Array<number>, flag: string): HandlerResult {
        let short = "";
        let long = "";
        let url = "";
        let status = "handled";

        const param = <number>(Array.isArray(params) ? params[0] : params);

        switch (flag) {
            case "A":
                short = "Cursor Up Ps Times (default = 1) (CUU).";

                this.buffer.moveCursorRelative({vertical: -(param || 1)});
                break;
            case "B":
                short = "Cursor Down Ps Times (default = 1) (CUD).";
                this.buffer.moveCursorRelative({vertical: (param || 1)});
                break;
            case "C":
                short = "Cursor Forward Ps Times (default = 1) (CUF).";

                this.buffer.moveCursorRelative({horizontal: (param || 1)});
                break;
            case "D":
                short = "Cursor Backward Ps Times (default = 1) (CUB).";

                this.buffer.moveCursorRelative({horizontal: -(param || 1)});
                break;
            // CSI Ps E  Cursor Next Line Ps Times (default = 1) (CNL).
            // CSI Ps F  Cursor Preceding Line Ps Times (default = 1) (CPL).
            case "G":
                short = "Cursor Character Absolute [column] (default = [row,1]) (CHA)";
                url = "http://www.vt100.net/docs/vt510-rm/CHA";

                this.buffer.moveCursorAbsolute({column: or1(param || 1) - 1});
                break;
            case "H":
                short = "Cursor Position [row;column] (default = [1,1]) (CUP).";
                url = "http://www.vt100.net/docs/vt510-rm/CUP";

                this.buffer.moveCursorAbsolute({row: or1(params[0]) - 1, column: or1(params[1]) - 1});
                break;
            case "J":
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
                    default:
                        throw `Unknown CSI erase: "${param}".`;
                }
                break;
            case "K":
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
                    default:
                        throw `Unknown CSI erase: "${param}".`;
                }
                break;
            case "L":
                url = "http://www.vt100.net/docs/vt510-rm/IL";
                short = "Inserts one or more blank lines, starting at the cursor. (DL)";

                this.buffer.scrollUp(param || 1, this.buffer.cursor.row);
                break;
            case "M":
                url = "http://www.vt100.net/docs/vt510-rm/DL";
                short = "Deletes one or more lines in the scrolling region, starting with the line that has the cursor. (DL)";

                this.buffer.scrollDown(param || 1, this.buffer.cursor.row);
                break;
            case "X":
                short = "Erase P s Character(s) (default = 1) (ECH)";
                url = "http://www.vt100.net/docs/vt510-rm/ECH";

                this.buffer.eraseRight(param || 1);
                break;
            case "c":
                this.job.write("\x1b>1;2;");
                break;
            case "d":
                short = "Line Position Absolute [row] (default = [1,column]) (VPA).";
                url = "http://www.vt100.net/docs/vt510-rm/VPA";

                this.buffer.moveCursorAbsolute({row: or1(param || 1) - 1});
                break;
            case "f":
                short = "Horizontal and Vertical Position [row;column] (default = [1,1]) (HVP).";
                url = "http://www.vt100.net/docs/vt510-rm/HVP";

                this.buffer.moveCursorAbsolute({row: or1(params[0]) - 1, column: or1(params[1]) - 1});
                break;
            case "m":
                short = `SGR: ${params}`;

                if (params.length === 0) {
                    short = "Reset SGR";
                    this.buffer.setAttributes(SGR[0]);
                    break;
                }

                while (params.length) {
                    const sgr = params.shift();

                    const attributeToSet = SGR[sgr];

                    if (!attributeToSet) {
                        error("sgr", sgr, params);
                    } else if (isSetColorExtended(attributeToSet)) {
                        const next = params.shift();
                        if (next === 5) {
                            const color = params.shift();
                            this.buffer.setAttributes({[<string>attributeToSet]: colorIndex[color]});
                        } else {
                            error("sgr", sgr, next, params);
                        }
                    } else {
                        this.buffer.setAttributes(attributeToSet);
                    }
                }
                break;
            case "r":
                url = "http://www.vt100.net/docs/vt510-rm/DECSTBM";
                short = "Set Scrolling Region [top;bottom] (default = full size of window) (DECSTBM).";

                let bottom = <number>(params[1] ? params[1] - 1 : undefined);
                let top = <number>(params[0] ? params[0] - 1 : undefined);

                this.buffer.margins = {top: top, bottom: bottom};
                this.buffer.moveCursorAbsolute({row: 0, column: 0});
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
}

function or1(value: number) {
    if (value === undefined) {
        return 1;
    } else {
        return value;
    }
}


// TODO: Move to
function logPosition(buffer: BufferModel) {
    const position = buffer.cursor.getPosition();
    debug(`%crow: ${position.row}\tcolumn: ${position.column}\t value: ${buffer.at(position)}`, "color: green");
}
