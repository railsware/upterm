var ANSIParser = require('node-ansiparser');
var e = require('./Enums');
var Utils_1 = require('./Utils');
var Color = e.Color;
var Weight = e.Weight;
var CGR = {
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
function isSetColorExtended(cgrValue) {
    return cgrValue === 'color' || cgrValue === 'background-color';
}
var CSI = {
    erase: {
        toEnd: 0,
        toBeginning: 1,
        entire: 2,
    }
};
var Parser = (function () {
    function Parser(invocation) {
        this.invocation = invocation;
        this.buffer = this.invocation.getBuffer();
        this.parser = this.initializeAnsiParser();
    }
    Parser.prototype.parse = function (data) {
        this.parser.parse(data);
    };
    Parser.prototype.initializeAnsiParser = function () {
        var _this = this;
        return new ANSIParser({
            inst_p: function (text) {
                Utils_1.default.info('text', text, text.charCodeAt(0), text.length);
                for (var i = 0; i !== text.length; ++i) {
                    _this.buffer.write(text.charAt(i));
                }
                logPosition(_this.buffer);
            },
            inst_o: function (s) {
                Utils_1.default.error('osc', s);
            },
            inst_x: function (flag) {
                Utils_1.default.info('flag', flag, flag.charCodeAt(0), flag.length);
                _this.buffer.write(flag);
                logPosition(_this.buffer);
            },
            inst_c: function (collected, params, flag) {
                if (collected === '?') {
                    if (params.length !== 1) {
                        return Utils_1.default.error("CSI private mode has " + params.length + " parameters: " + params);
                    }
                    if (flag !== 'h' && flag !== 'l') {
                        return Utils_1.default.error("CSI private mode has an incorrect flag: " + flag);
                    }
                    var mode = params[0];
                    var handlerResult = _this.decPrivateModeHandler(mode, flag);
                    if (handlerResult.status === 'handled') {
                        Utils_1.default.info("%cCSI ? " + mode + " " + flag, "color: blue", handlerResult.description, handlerResult.url);
                    }
                    else {
                        Utils_1.default.error("%cCSI ? " + mode + " " + flag, "color: blue", handlerResult.description, handlerResult.url);
                    }
                }
                else {
                    handlerResult = _this.csiHandler(collected, params, flag);
                    if (handlerResult.status === 'handled') {
                        Utils_1.default.info("%cCSI " + params + " " + flag, "color: blue", handlerResult.description, handlerResult.url);
                    }
                    else {
                        Utils_1.default.error("%cCSI " + params + " " + flag, "color: blue", handlerResult.description, handlerResult.url);
                    }
                }
                logPosition(_this.buffer);
            },
            inst_e: function (collected, flag) {
                var handlerResult = _this.escapeHandler(collected, flag);
                if (handlerResult.status === 'handled') {
                    Utils_1.default.info("%cESC " + collected + " " + flag, "color: blue", handlerResult.description, handlerResult.url);
                }
                else {
                    Utils_1.default.error("%cESC " + collected + " " + flag, "color: blue", handlerResult.description, handlerResult.url);
                }
                logPosition(_this.buffer);
            }
        });
    };
    Parser.prototype.escapeHandler = function (collected, flag) {
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
            }
            else {
                status = 'unhandled';
            }
        }
        else {
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
    };
    Parser.prototype.decPrivateModeHandler = function (ps, flag) {
        var description = '';
        var url = '';
        var status = 'handled';
        var isSet = flag === 'h';
        switch (ps) {
            case 3:
                url = "http://www.vt100.net/docs/vt510-rm/DECCOLM";
                if (isSet) {
                    description = "132 Column Mode (DECCOLM).";
                    this.invocation.setDimensions({ columns: 132, rows: this.invocation.getDimensions().rows });
                }
                else {
                    description = "80 Column Mode (DECCOLM).";
                    this.invocation.setDimensions({ columns: 80, rows: this.invocation.getDimensions().rows });
                }
                this.buffer.clear();
                break;
            case 12:
                if (isSet) {
                    description = "Start Blinking Cursor (att610).";
                    this.buffer.blinkCursor(true);
                }
                else {
                    description = "Stop Blinking Cursor (att610).";
                    this.buffer.blinkCursor(false);
                }
                break;
            case 25:
                url = "http://www.vt100.net/docs/vt510-rm/DECTCEM";
                if (isSet) {
                    description = "Show Cursor (DECTCEM).";
                    this.buffer.showCursor(true);
                }
                else {
                    description = "Hide Cursor (DECTCEM).";
                    this.buffer.showCursor(false);
                }
                break;
            case 1049:
                if (isSet) {
                    description = "Save cursor as in DECSC and use Alternate Screen Buffer, clearing it first.  (This may be disabled by the titeInhibit resource).  This combines the effects of the 1047  and 1048  modes.  Use this with terminfo-based applications rather than the 47  mode.";
                    this.buffer.activeBuffer = 'alternate';
                    break;
                }
            case 2004:
                if (isSet) {
                    description = "Set bracketed paste mode.";
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
    };
    Parser.prototype.csiHandler = function (collected, params, flag) {
        var short = '';
        var long = '';
        var url = '';
        var status = 'handled';
        var param = (Array.isArray(params) ? params[0] : params);
        switch (flag) {
            case 'm':
                short = 'Some CGR stuff';
                if (params.length === 0) {
                    short = 'Reset CGR';
                    this.buffer.setAttributes(CGR[0]);
                    break;
                }
                while (params.length) {
                    var cgr = params.shift();
                    var attributeToSet = CGR[cgr];
                    if (!attributeToSet) {
                        Utils_1.default.error('cgr', cgr, params);
                    }
                    else if (isSetColorExtended(attributeToSet)) {
                        var next = params.shift();
                        if (next === 5) {
                            var colorIndex = params.shift();
                            this.buffer.setAttributes((_a = {}, _a[attributeToSet] = e.ColorIndex[colorIndex], _a));
                        }
                        else {
                            Utils_1.default.error('cgr', cgr, next, params);
                        }
                    }
                    else if (attributeToSet === 'negative') {
                        var attributes = this.buffer.getAttributes();
                        this.buffer.setAttributes({
                            'background-color': attributes.color,
                            'color': attributes['background-color']
                        });
                    }
                    else {
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
            default:
                status = 'unhandled';
        }
        return {
            status: status,
            description: short,
            longDescription: long,
            url: url
        };
        var _a;
    };
    return Parser;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Parser;
function or1(number) {
    if (number === null) {
        return 1;
    }
    else {
        return number;
    }
}
function logPosition(buffer) {
    var position = buffer.cursor.getPosition();
    Utils_1.default.debug("%crow: " + position.row + "\tcolumn: " + position.column, "color: green");
}
