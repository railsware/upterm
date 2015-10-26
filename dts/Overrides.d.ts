interface Window {
    DEBUG: boolean;
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
