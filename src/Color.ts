/// <reference path="references.ts" />

var _: _.LoDashStatic = require('lodash');

module BlackScreen {
    export var ColorIndex: Array<any> = [
        'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',

        'bright-black', 'bright-red', 'bright-green', 'bright-yellow',
        'bright-blue', 'bright-magenta', 'bright-cyan', 'bright-white',
    ].concat(<Array<any>>_.range(16, 256));

    export enum Color {
        Black = <Color>ColorIndex[0],
        Red = <Color>ColorIndex[1],
        Green = <Color>ColorIndex[2],
        Yellow = <Color>ColorIndex[3],
        Blue = <Color>ColorIndex[4],
        Magenta = <Color>ColorIndex[5],
        Cyan = <Color>ColorIndex[6],
        White = <Color>ColorIndex[7],

        BrightBlack = <Color>ColorIndex[8],
        BrightRed = <Color>ColorIndex[9],
        BrightGreen = <Color>ColorIndex[10],
        BrightYellow = <Color>ColorIndex[11],
        BrightBlue = <Color>ColorIndex[12],
        BrightMagenta = <Color>ColorIndex[13],
        BrightCyan = <Color>ColorIndex[14],
        BrightWhite = <Color>ColorIndex[15],
    }
}
