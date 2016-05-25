interface KeyDownReceiver {
    handleKeyDown(event: KeyboardEvent): void;
}

declare class Notification {
    constructor(str: string);
    constructor(title: string, options: { body: string });
}

interface Window {
    DEBUG: boolean;
    jobUnderAttention: KeyDownReceiver;
    promptUnderAttention: KeyDownReceiver;
    Notification: typeof Notification;
}

declare type Offset = {top: number, left: number, bottom: number};

interface JQuery {
    fixedsticky: Function;
    caret: (v: string|number) => Offset;
}

declare class AnsiParser {
    constructor(callbacks: Dictionary<Function>)

    parse(data: string): any;
}

declare module "fs-extra" {
    export function walk(dirPath: string): NodeJS.ReadableStream;
}

interface Array<T> {
    includes(value: T): boolean;
}

declare namespace __React {
    interface DOMAttributes {
        onKeyDownCapture?: KeyboardEventHandler;
        onClickCapture?: KeyboardEventHandler;
        dataColor?: any;
    }
}

interface KeyboardEvent extends UIEvent {
    keyIdentifier: string;
}

interface NodeBuffer extends Uint8Array {
    fill(value: number, offset?: number, end?: number): this;
}

interface ObjectConstructor {
    assign<A, B, C, D, E, F>(a: A, b: B, c: C, d: D, e: E, f: F): A & B & C & D & E & F;
}
