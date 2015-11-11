import * as e from './Enums';
import * as fs from 'fs';
import * as React from 'react';
import Prompt from "./Prompt";
import Job from "./Job";

export interface Dimensions {
    columns: number;
    rows: number;
}

export interface Attributes {
    color?: e.Color;
    'background-color'?: e.Color;
    weight?: e.Weight;
    underline?: boolean;
    crossedOut?: boolean;
    blinking?: boolean;
    cursor?: boolean;
}

export interface Size {
    height: number;
    width: number;
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
    getSuggestions(prompt: Prompt): Promise<Suggestion[]>;
}

export interface Suggestion {
    value: string;
    score: number;
    synopsis: string;
    description: string;
    type: string;
    partial?: boolean;
    replaceAll?: boolean;
    prefix?: string;
}

export interface VcsData {
    isRepository: boolean;
    branch?: string;
    status?: string;
}

export interface FileInfo {
    name: string;
    stat: fs.Stats;
}

export interface Margins {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
}

export interface OutputDecorator {
    isApplicable: (job: Job) => boolean;
    decorate: (job: Job) => React.ReactElement<any>;

    /**
     * @note Setting this property to `true` will result in rendering performance
     *       decrease because the output will be re-decorated after each data chunk.
     */
    shouldDecorateRunningPrograms?: boolean;
}
