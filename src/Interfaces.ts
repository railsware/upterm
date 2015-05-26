import e = require('./Enums');

export interface Dimensions {
    columns: number;
    rows: number;
}

export interface Attributes {
    color?: e.Color;
    weight?: e.Weight;
    underline?: boolean;
    crossedOut?: boolean;
}

export interface Advancement {
    vertical?: number;
    horizontal?: number;
}

export interface Position {
    column: number;
    row: number;
}

export interface AutocompletionProvider {
    getSuggestions(currentDirectory: string, input: Parsable): Promise<RankedSuggestion[]>;
}

export interface Suggestion {
    value: string;
    priority: number;
    synopsis: string;
    description: string;
    type: string;
}

export interface RankedSuggestion {
    item: Suggestion;
    score: number;
}

export interface Parsable {
    getLexemes: () => string[];
    getLastLexeme: () => string;
    getText: () => string;
    parse: () => void;
    onParsingError: Function;
}
