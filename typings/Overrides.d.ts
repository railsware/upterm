interface KeyDownReceiver {
    handleKeyDown(event: KeyboardEvent): void;
}

interface NotificationConstructor {
    new(str: string): void;
}

interface Window {
    DEBUG: boolean;
    jobUnderAttention: KeyDownReceiver;
    promptUnderAttention: KeyDownReceiver
    Notification: NotificationConstructor
}

declare type Offset = {top: number, left: number, bottom: number};

interface JQuery {
    fixedsticky: Function;
    caret: (v: string|number) => Offset;
}

interface ObjectChange {
    name: string;
    object: any;
    type: string;
    oldValue?: any;
}

interface AnsiParserConstructor {
    new (callbacks: { [key:string]: Function }): AnsiParser
}

interface AnsiParser {
    parse(data: string): any;
}

declare module _ {
    interface LoDashStatic {
        _: LoDashStatic;
    }
}
declare module "fs" {
    export function watch(filename: string, options: { persistent?: boolean; recursive?: boolean }, listener?: (event: string, filename: string) => any): FSWatcher;
}

declare module "fs-extra" {
    export function walk(dirPath: string): NodeJS.ReadableStream;
}

declare namespace __React {
    interface KeyboardEvent {
        keyIdentifier: number;
    }
}
