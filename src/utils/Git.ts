import {linedOutputOf} from "../PTY";
import * as Path from "path";
import * as fs from "fs";
import * as _ from "lodash";

export class Branch {
    constructor(private refName: string, private _isCurrent: boolean) {
    }

    toString(): string {
        return _.last(this.refName.split("/"));
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

type GitDirectoryPath = string & { __isGitDirectoryPath: boolean };

export function isGitDirectory(directory: string): directory is GitDirectoryPath {
    return fs.existsSync(Path.join(directory, ".git") );
}

export async function branches(directory: GitDirectoryPath): Promise<Branch[]> {
    let lines = await linedOutputOf(
        "git",
        ["for-each-ref", "refs/tags", "refs/heads", "refs/remotes", "--format='%(HEAD)%(refname:short)'"],
        directory
    );
    return lines.map(line => new Branch(line.slice(1), line[0] === "*"));
}

export async function status(directory: GitDirectoryPath): Promise<FileStatus[]> {
    let lines = await linedOutputOf("git", ["status", "--porcelain"], directory);
    return lines.map(line => new FileStatus(line));
}
