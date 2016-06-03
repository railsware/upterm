import * as _ from "lodash";

/**
 * @link https://css-tricks.com/snippets/javascript/javascript-keycodes/
 * @link https://lists.w3.org/Archives/Public/www-dom/2010JulSep/att-0182/keyCode-spec.html
 */
export enum KeyCode {
    Bell = 7,
    Backspace = 8,
    Tab = 9,
    NewLine = 10,
    CarriageReturn = 13,
    Shift = 16,
    Ctrl = 17,
    Alt = 18,
    Escape = 27,
    Space = 32,
    Left = 37,
    Up = 38,
    Right = 39,
    Down = 40,
    One = 49,
    Nine = 57,
    A = 65,
    B = 66,
    C = 67,
    D = 68,
    E = 69,
    F = 70,
    G = 71,
    H = 72,
    I = 73,
    J = 74,
    K = 75,
    L = 76,
    M = 77,
    N = 78,
    O = 79,
    P = 80,
    Q = 81,
    R = 82,
    S = 83,
    T = 84,
    U = 85,
    V = 86,
    W = 87,
    X = 88,
    Y = 89,
    Z = 90,
    Delete = 127,
    Underscore = 189,
    Period = 190,
    VerticalBar = 220,
}

export var colorIndex: any[] = [
    "black", "red", "green", "yellow", "blue", "magenta", "cyan", "white",

    "brightBlack", "brightRed", "brightGreen", "brightYellow",
    "brightBlue", "brightMagenta", "brightCyan", "brightWhite",
].concat(<Array<any>>_.range(16, 256));

export enum Color {
    Black = <Color>colorIndex[0],
    Red = <Color>colorIndex[1],
    Green = <Color>colorIndex[2],
    Yellow = <Color>colorIndex[3],
    Blue = <Color>colorIndex[4],
    Magenta = <Color>colorIndex[5],
    Cyan = <Color>colorIndex[6],
    White = <Color>colorIndex[7],

    BrightBlack = <Color>colorIndex[8],
    BrightRed = <Color>colorIndex[9],
    BrightGreen = <Color>colorIndex[10],
    BrightYellow = <Color>colorIndex[11],
    BrightBlue = <Color>colorIndex[12],
    BrightMagenta = <Color>colorIndex[13],
    BrightCyan = <Color>colorIndex[14],
    BrightWhite = <Color>colorIndex[15],
}

export enum Status {
    NotStarted,
    InProgress,
    Failure,
    Interrupted,
    Success,
}

export enum ScreenBufferType {
    Standard,
    Alternate
}

export enum Weight {
    Normal,
    Bold,
    Faint,
}

export enum Brightness {
    Normal,
    Bright,
}

export enum LogLevel {
    Info = <LogLevel><any>"info",
    Debug = <LogLevel><any>"debug",
    Log = <LogLevel><any>"log",
    Error = <LogLevel><any>"error",
}
