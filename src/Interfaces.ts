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
    //TODO: deduce the type from class name.
    type: string;
    getSuggestions(currentDirectory: string, input: string, callback: (suggestions: Suggestion[]) => void): void;
}

export interface Suggestion {
    value: string,
    synopsis: string,
    description: string,
}

export interface TypedSuggestion extends Suggestion {
    type: string,
}
