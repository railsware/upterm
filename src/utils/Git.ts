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

export type StatusCode =
    "Unmodified" |

    "UnstagedModified" |
    "UnstagedDeleted" |
    "StagedModified" |
    "StagedModifiedUnstagedModified" |
    "StagedModifiedUnstagedDeleted" |
    "StagedAdded" |
    "StagedAddedUnstagedModified" |
    "StagedAddedUnstagedDeleted" |
    "StagedDeleted" |
    "StagedDeletedUnstagedModified" |
    "StagedRenamed" |
    "StagedRenamedUnstagedModified" |
    "StagedRenamedUnstagedDeleted" |
    "StagedCopied" |
    "StagedCopiedUnstagedModified" |
    "StagedCopiedUnstagedDeleted" |

    "UnmergedBothDeleted" |
    "UnmergedAddedByUs" |
    "UnmergedDeletedByThem" |
    "UnmergedAddedByThem" |
    "UnmergedDeletedByUs" |
    "UnmergedBothAdded" |
    "UnmergedBothModified" |

    "Untracked" |
    "Ignored" |

    "Invalid"

function lettersToStatusCode(letters: string): StatusCode {
    switch (letters) {
        case "  ": return "Unmodified";

        case " M": return "UnstagedModified";
        case " D": return "UnstagedDeleted";
        case "M ": return "StagedModified";
        case "MM": return "StagedModifiedUnstagedModified";
        case "MD": return "StagedModifiedUnstagedDeleted";
        case "A ": return "StagedAdded";
        case "AM": return "StagedAddedUnstagedModified";
        case "AD": return "StagedAddedUnstagedDeleted";
        case "D ": return "StagedDeleted";
        case "DM": return "StagedDeletedUnstagedModified";
        case "R ": return "StagedRenamed";
        case "RM": return "StagedRenamedUnstagedModified";
        case "RD": return "StagedRenamedUnstagedDeleted";
        case "C ": return "StagedCopied";
        case "CM": return "StagedCopiedUnstagedModified";
        case "CD": return "StagedCopiedUnstagedDeleted";

        case "DD": return "UnmergedBothDeleted";
        case "AU": return "UnmergedAddedByUs";
        case "UD": return "UnmergedDeletedByThem";
        case "UA": return "UnmergedAddedByThem";
        case "DU": return "UnmergedDeletedByUs";
        case "AA": return "UnmergedBothAdded";
        case "UU": return "UnmergedBothModified";

        case "??": return "Untracked";
        case "!!": return "Ignored";

        default: return "Invalid";
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

export type GitDirectoryPath = string & { __isGitDirectoryPath: boolean };

export function isGitDirectory(directory: string): directory is GitDirectoryPath {
    return fs.existsSync(Path.join(directory, ".git") );
}

type BranchesOptions = {
    directory: GitDirectoryPath;
    remotes: boolean;
    tags: boolean;
};

export async function branches({
    directory,
    remotes,
    tags,
}: BranchesOptions): Promise<Branch[]> {
    let lines = await linedOutputOf(
        "git",
        ["for-each-ref", tags ? "refs/tags" : "", "refs/heads", remotes ? "refs/remotes" : "", "--format='%(HEAD)%(refname:short)'"],
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

export async function repoRoot(directory: GitDirectoryPath): Promise<GitDirectoryPath> {
    return (await linedOutputOf("git", ["rev-parse", "--show-toplevel"], directory))[0] as GitDirectoryPath;
}
