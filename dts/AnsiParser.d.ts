interface AnsiParserConstructor {
    new (callbacks: { [key:string]: Function }): AnsiParser
}

interface AnsiParser {
    parse(data: string);
}
