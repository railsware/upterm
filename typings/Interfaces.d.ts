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
interface PartialRowColumn {
    column?: number;
    row?: number;
}

interface VcsData {
    isRepository: boolean;
    branch?: string;
    status?: string;
}

interface Margins {
    top: number;
    bottom?: number;
    left: number;
    right?: number;
}
interface PartialMargins {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
}

interface Dictionary<T> {
    [index: string]: T;
}

interface ProcessEnvironment extends Dictionary<string> {
    PWD: string;
}
