import {delimiter} from "path";
import {executeCommandWithShellConfig} from "./PTY";
import {clone} from "lodash";
import {homeDirectory} from "./utils/Common";
import * as Path from "path";
import {AbstractOrderedSet} from "./utils/OrderedSet";

const ignoredEnvironmentVariables = [
    "NODE_ENV",
];
export const processEnvironment: Dictionary<string> = {};
export async function loadEnvironment(): Promise<void> {
    const lines = await executeCommandWithShellConfig("env");

    lines.forEach(line => {
        let [key, value] = line.trim().split("=");

        if (!ignoredEnvironmentVariables.includes(key)) {
            processEnvironment[key] = value;
        }
    });
}

export class Environment {
    private storage: Dictionary<string>;

    constructor(environment: Dictionary<string>) {
        this.storage = clone(environment);
    }

    set(key: string, value: string): void {
        this.storage[key] = value;
    }

    setMany(pairs: Dictionary<string>): void {
        for (const key of Object.keys(pairs)) {
            this.set(key, pairs[key]);
        }
    }

    toObject(): ProcessEnvironment {
        return <ProcessEnvironment>this.storage;
    }

    map<R>(mapper: (key: string, value: string) => R): Array<R> {
        const result: Array<R> = [];

        for (const key of Object.keys(this.storage)) {
            result.push(mapper(key, this.storage[key]));
        }

        return result;
    }

    get(key: string): string {
        return this.storage[key];
    }

    has(key: string): boolean {
        return key in this.storage;
    }

    get path(): EnvironmentPath {
        return new EnvironmentPath(this);
    }

    cdpath(pwd: string): string[] {
        return (this.get("CDPATH") || "").split(delimiter).map(path => path || pwd);
    }

    get pwd(): string {
        if (!this.get("PWD")) {
            this.pwd = homeDirectory;
        }

        return this.get("PWD");
    }

    set pwd(value: string) {
        this.set("PWD", value);
    }
}

export class EnvironmentPath extends AbstractOrderedSet<string> {
    constructor(private environment: Environment) {
        super(
            () => {
                const path = this.environment.get("PATH");

                if (path) {
                    return path.split(Path.delimiter);
                } else {
                    return [];
                }
            },
            updatedPaths => this.environment.set("PATH", updatedPaths.join(Path.delimiter))
        );
    }
}
