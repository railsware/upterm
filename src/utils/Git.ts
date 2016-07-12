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
    Untracked,
    Unmodified,
    Modified,
    Added,
    Deleted,
    Renamed,
    Copied,
    UpdatedButUnmerged
}

function lettersToStatusCode(letters: string): StatusCode {
    switch (letters) {
        case "??":
            return StatusCode.Untracked;
        case "  ":
            return StatusCode.Unmodified;
        case " M":
            return StatusCode.Modified;
        case " A":
            return StatusCode.Added;
        case " D":
            return StatusCode.Deleted;
        case " R":
            return StatusCode.Renamed;
        case " C":
            return StatusCode.Copied;
        case " U":
            return StatusCode.UpdatedButUnmerged;
        default:
            throw `Unknown Git status code: ${letters}`;
    }
}

export class FileStatus {
    constructor(private _line: string) {
    }

    get value(): string {
        return this._line.slice(3).trim();
    }

    get code(): StatusCode {
        return lettersToStatusCode(this._line.slice(0, 2));
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

export async function configVariables(directory: string): Promise<string[]> {
    const lines = await linedOutputOf(
        "git",
        ["config", "--list"],
        directory
    );

    return lines.map(line => line.split("=")[0].trim());
}

export async function remotes(directory: GitDirectoryPath): Promise<string[]> {
    return await linedOutputOf("git", ["remote"], directory);
}

export async function status(directory: GitDirectoryPath): Promise<FileStatus[]> {
    let lines = await linedOutputOf("git", ["status", "--porcelain"], directory);
    return lines.map(line => new FileStatus(line));
}
