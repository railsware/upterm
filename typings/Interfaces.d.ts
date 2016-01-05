interface Size {
    height: number;
    width: number;
}

interface Dimensions {
    columns: number;
    rows: number;
}

interface Advancement {
    vertical?: number;
    horizontal?: number;
}

interface RowColumn {
    column: number;
    row: number;
}

interface Suggestion {
    value: string;
    score: number;
    synopsis: string;
    description: string;
    type: string;
    partial?: boolean; // Whether to put a space after it.
    replaceAll?: boolean;
    prefix?: string;
}

interface VcsData {
    isRepository: boolean;
    branch?: string;
    status?: string;
}


interface Margins {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
}
