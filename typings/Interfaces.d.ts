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

type VcsStatus = "dirty" | "clean";

type VcsData = { kind: "repository", branch: string; status: VcsStatus; } | { kind: "not-repository"; }

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

type EscapedShellWord = string & {__isEscapedShellToken: any};
type FullPath = string & { __isFullPath: boolean };
type ExistingAlias = string & { __isExistingAlias: boolean };
type OneBasedPosition = number;
