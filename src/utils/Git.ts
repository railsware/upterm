import {linedOutputOf} from "../PTY";

export class Branch {
    constructor(private name: string, private _isCurrent: boolean) {
    }

    toString(): string {
        return this.name;
    }

    isCurrent(): boolean {
        return this._isCurrent;
    }
}



export enum StatusCode {
    Unmodified,
    Modified,
    Added,
    Deleted,
    Renamed,
    Copied,
    UpdatedButUnmerged
}

function letterToStatusCode(letter: string): StatusCode {
    switch (letter) {
        case " ":
            return StatusCode.Unmodified;
        case "M":
            return StatusCode.Modified;
        case "A":
            return StatusCode.Added;
        case "D":
            return StatusCode.Deleted;
        case "R":
            return StatusCode.Renamed;
        case "C":
            return StatusCode.Copied;
        case "U":
            return StatusCode.UpdatedButUnmerged;
        default:
            throw "Should never happen.";
    }
}

export class FileStatus {
    constructor(private _line: string) {
    }

    get value(): string {
        return this._line.substring(3).trim();
    }

    get code(): StatusCode {
        return letterToStatusCode(this._line[1]);
    }
}

export async function branches(directory: string): Promise<Branch[]> {
    let lines = await linedOutputOf("git", ["branch", "--no-color"], directory);
    return lines.map(line => new Branch(line.slice(2), line[0] === "*"));
}

export async function status(directory: string): Promise<FileStatus[]> {
    let lines = await linedOutputOf("git", ["status", "--porcelain"], directory);
    return lines.map(line => new FileStatus(line));
}
