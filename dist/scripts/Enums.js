var _ = require('lodash');
(function (CharCode) {
    CharCode[CharCode["Bell"] = 7] = "Bell";
    CharCode[CharCode["Backspace"] = 8] = "Backspace";
    CharCode[CharCode["NewLine"] = 10] = "NewLine";
    CharCode[CharCode["CarriageReturn"] = 13] = "CarriageReturn";
    CharCode[CharCode["Delete"] = 127] = "Delete";
})(exports.CharCode || (exports.CharCode = {}));
var CharCode = exports.CharCode;
exports.ColorIndex = [
    'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
    'bright-black', 'bright-red', 'bright-green', 'bright-yellow',
    'bright-blue', 'bright-magenta', 'bright-cyan', 'bright-white',
].concat(_.range(16, 256));
(function (Color) {
    Color[Color["Black"] = exports.ColorIndex[0]] = "Black";
    Color[Color["Red"] = exports.ColorIndex[1]] = "Red";
    Color[Color["Green"] = exports.ColorIndex[2]] = "Green";
    Color[Color["Yellow"] = exports.ColorIndex[3]] = "Yellow";
    Color[Color["Blue"] = exports.ColorIndex[4]] = "Blue";
    Color[Color["Magenta"] = exports.ColorIndex[5]] = "Magenta";
    Color[Color["Cyan"] = exports.ColorIndex[6]] = "Cyan";
    Color[Color["White"] = exports.ColorIndex[7]] = "White";
    Color[Color["BrightBlack"] = exports.ColorIndex[8]] = "BrightBlack";
    Color[Color["BrightRed"] = exports.ColorIndex[9]] = "BrightRed";
    Color[Color["BrightGreen"] = exports.ColorIndex[10]] = "BrightGreen";
    Color[Color["BrightYellow"] = exports.ColorIndex[11]] = "BrightYellow";
    Color[Color["BrightBlue"] = exports.ColorIndex[12]] = "BrightBlue";
    Color[Color["BrightMagenta"] = exports.ColorIndex[13]] = "BrightMagenta";
    Color[Color["BrightCyan"] = exports.ColorIndex[14]] = "BrightCyan";
    Color[Color["BrightWhite"] = exports.ColorIndex[15]] = "BrightWhite";
})(exports.Color || (exports.Color = {}));
var Color = exports.Color;
(function (Status) {
    Status[Status["NotStarted"] = 'not-started'] = "NotStarted";
    Status[Status["InProgress"] = 'in-progress'] = "InProgress";
    Status[Status["Failure"] = 'failure'] = "Failure";
    Status[Status["Success"] = 'success'] = "Success";
})(exports.Status || (exports.Status = {}));
var Status = exports.Status;
(function (Weight) {
    Weight[Weight["Normal"] = 'normal'] = "Normal";
    Weight[Weight["Bold"] = 'bold'] = "Bold";
    Weight[Weight["Faint"] = 'faint'] = "Faint";
})(exports.Weight || (exports.Weight = {}));
var Weight = exports.Weight;
