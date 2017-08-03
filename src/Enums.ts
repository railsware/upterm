/**
 * @link https://css-tricks.com/snippets/javascript/javascript-keycodes/
 * @link https://lists.w3.org/Archives/Public/www-dom/2010JulSep/att-0182/keyCode-spec.html
 */
export enum KeyCode {
    Bell = 7,
    Backspace = 8,
    Tab = 9,
    NewLine = 10,
    VerticalTab = 11,
    CarriageReturn = 13,
    ShiftOut = 14,
    ShiftIn = 15,
    Shift = 16,
    Ctrl = 17,
    Alt = 18,
    CapsLock = 20,
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
    Meta = 91,
    Delete = 127,
    Underscore = 189,
    Period = 190,
    VerticalBar = 220,
    AltGraph = 225,
}

export enum Color {
    Black,
    Red,
    Green,
    Yellow,
    Blue,
    Magenta,
    Cyan,
    White,
}

export enum Status {
    InProgress = "in-progress",
    Failed = "failed",
    Success = "success",
}
export enum ScreenMode {
    Light = "light",
    Dark = "dark",
}

export enum BufferType {
    Normal = "normal",
    Alternate = "alternate",
}

export enum Weight {
    Normal = "normal",
    Bold = "bold",
    Faint = "faint",
}

export enum Brightness {
    Normal = "normal",
    Bright = "bright",
}

export enum LogLevel {
    Info = "info",
    Log = "log",
    Error = "error",
}

export enum KeyboardAction {
    // CLI commands
    cliRunCommand,
    cliClearJobs,
    cliClearText,
    cliAppendLastArgumentOfPreviousCommand,
    cliHistoryPrevious,
    cliHistoryNext,
    // autocomplete commands
    autocompleteInsertCompletion,
    autocompletePreviousSuggestion,
    autocompleteNextSuggestion,
    // tab commands
    tabNew,
    tabFocus,
    tabPrevious,
    tabNext,
    tabClose,
    // session commands
    otherSession,
    sessionPrevious,
    sessionNext,
    sessionClose,
    // edit/clipboard commands
    clipboardCopy,
    clipboardCut,
    clipboardPaste,
    editUndo,
    editRedo,
    editSelectAll,
    editFind,
    editFindClose,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    // view commands
    viewReload,
    viewToggleFullScreen,
    // Upterm commands
    uptermHide,
    uptermQuit,
    uptermHideOthers,
    // developer
    developerToggleTools,
}
