import * as _ from "lodash";

export enum CharCode {
    Bell = 7,
    Backspace = 8,
    Tab = 9,
    NewLine = 10,
    CarriageReturn = 13,
    Delete = 127
}

export var colorIndex: any[] = [
    "black", "red", "green", "yellow", "blue", "magenta", "cyan", "white",

    "bright-black", "bright-red", "bright-green", "bright-yellow",
    "bright-blue", "bright-magenta", "bright-cyan", "bright-white",
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
    NotStarted = <Status><any>"not-started",
    InProgress = <Status><any>"in-progress",
    Failure = <Status><any>"failure",
    Interrupted = <Status><any>"interrupted",
    Success = <Status><any>"success",
}

export enum Buffer {
    Standard = <Buffer><any>"standard",
    Alternate = <Buffer><any>"alternate"
}

export enum Weight {
    Normal = <Weight><any>"normal",
    Bold = <Weight><any>"bold",
    Faint = <Weight><any>"faint",
}

export enum Brightness {
    Normal = <Brightness><any>"normal",
    Bright = <Brightness><any>"bright",
}

export enum LogLevel {
    Info = <LogLevel><any>"info",
    Debug = <LogLevel><any>"debug",
    Log = <LogLevel><any>"log",
    Error = <LogLevel><any>"error",
}
