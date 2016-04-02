import {linedOutputOf} from "../PTY";

class Branch {
    constructor(private name: string, private _isCurrent: boolean) {
    }

    toString(): string {
        return this.name;
    }

    isCurrent(): boolean {
        return this._isCurrent;
    }
}

export async function branches(directory: string) {
    let lines = await linedOutputOf("git", ["branch", "--no-color"], directory);
    return lines.map(line => new Branch(line.slice(2), line[0] === "*"));
}
