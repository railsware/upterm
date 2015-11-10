interface KeyDownReceiver {
    handleKeyDown(event: KeyboardEvent): void;
}

interface Window {
    DEBUG: boolean;
    invocationUnderAttention: KeyDownReceiver;
    promptUnderAttention: KeyDownReceiver
}

interface JQuery {
    fixedsticky: Function;
    caret: (v: string|number) => number;
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

declare namespace __React {
    interface KeyboardEvent {
        keyIdentifier: number;
    }
}
