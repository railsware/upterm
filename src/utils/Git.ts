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

export interface ConfigVariable {
    name: string;
    value: string;
}

export enum StatusCode {
    Unmodified,

    UnstagedModified,
    UnstagedDeleted,
    StagedModified,
    StagedModifiedUnstagedModified,
    StagedModifiedUnstagedDeleted,
    StagedAdded,
    StagedAddedUnstagedModified,
    StagedAddedUnstagedDeleted,
    StagedDeleted,
    StagedDeletedUnstagedModified,
    StagedRenamed,
    StagedRenamedUnstagedModified,
    StagedRenamedUnstagedDeleted,
    StagedCopied,
    StagedCopiedUnstagedModified,
    StagedCopiedUnstagedDeleted,

    UnmergedBothDeleted,
    UnmergedAddedByUs,
    UnmergedDeletedByThem,
    UnmergedAddedByThem,
    UnmergedDeletedByUs,
    UnmergedBothAdded,
    UnmergedBothModified,

    Untracked,
    Ignored,

    Invalid,
}

function lettersToStatusCode(letters: string): StatusCode {
    switch (letters) {
        case "  ": return StatusCode.Unmodified;

        case " M": return StatusCode.UnstagedModified;
        case " D": return StatusCode.UnstagedDeleted;
        case "M ": return StatusCode.StagedModified;
        case "MM": return StatusCode.StagedModifiedUnstagedModified;
        case "MD": return StatusCode.StagedModifiedUnstagedDeleted;
        case "A ": return StatusCode.StagedAdded;
        case "AM": return StatusCode.StagedAddedUnstagedModified;
        case "AD": return StatusCode.StagedAddedUnstagedDeleted;
        case "D ": return StatusCode.StagedDeleted;
        case "DM": return StatusCode.StagedDeletedUnstagedModified;
        case "R ": return StatusCode.StagedRenamed;
        case "RM": return StatusCode.StagedRenamedUnstagedModified;
        case "RD": return StatusCode.StagedRenamedUnstagedDeleted;
        case "C ": return StatusCode.StagedCopied;
        case "CM": return StatusCode.StagedCopiedUnstagedModified;
        case "CD": return StatusCode.StagedCopiedUnstagedDeleted;

        case "DD": return StatusCode.UnmergedBothDeleted;
        case "AU": return StatusCode.UnmergedAddedByUs;
        case "UD": return StatusCode.UnmergedDeletedByThem;
        case "UA": return StatusCode.UnmergedAddedByThem;
        case "DU": return StatusCode.UnmergedDeletedByUs;
        case "AA": return StatusCode.UnmergedBothAdded;
        case "UU": return StatusCode.UnmergedBothModified;

        case "??": return StatusCode.Untracked;
        case "!!": return StatusCode.Ignored;

        default: return StatusCode.Invalid
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

export async function configVariables(directory: string): Promise<ConfigVariable[]> {
    const lines = await linedOutputOf(
        "git",
        ["config", "--list"],
        directory
    );

    return lines.map(line => {
        const parts = line.split("=");

        return {
            name: parts[0].trim(),
            value: parts[1] ? parts[1].trim() : "",
        };
    });
}

export async function aliases(directory: string): Promise<ConfigVariable[]> {
    const variables = await configVariables(directory);

    return variables
        .filter(variable => variable.name.indexOf("alias.") === 0)
        .map(variable => {
            return {
                name: variable.name.replace("alias.", ""),
                value: variable.value,
            };
        });
}

export async function remotes(directory: GitDirectoryPath): Promise<string[]> {
    return await linedOutputOf("git", ["remote"], directory);
}

export async function status(directory: GitDirectoryPath): Promise<FileStatus[]> {
    let lines = await linedOutputOf("git", ["status", "--porcelain"], directory);
    return lines.map(line => new FileStatus(line));
}
