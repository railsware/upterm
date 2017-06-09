import {delimiter} from "path";
import * as _ from "lodash";
import {executeCommandWithShellConfig} from "../PTY";
import {clone} from "lodash";
import {homeDirectory, resolveDirectory} from "../utils/Common";
import * as Path from "path";
import {AbstractOrderedSet} from "../utils/OrderedSet";
import {loginShell} from "../utils/Shell";

const ignoredEnvironmentVariables = [
    "NODE_ENV",
];

const isIgnoredEnvironmentVariable = (varName: string) => {
    if (ignoredEnvironmentVariables.includes(varName)) {
        return true;
    } else {
        return false;
    }
};

export const preprocessEnv = (lines: string[]) => {
    // Bash functions in the env have newlines in them, which need to be removed
    const joinedFunctionLines: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        if (/^BASH_FUNC\w+%%/.test(lines[i])) {
            const finalLineOfFunction = lines.indexOf("}", i);
            joinedFunctionLines.push(lines.slice(i, finalLineOfFunction + 1).join("\n"));
            i = finalLineOfFunction;
        } else {
            joinedFunctionLines.push(lines[i]);
        }
    }
    return joinedFunctionLines;
};

export const processEnvironment: Dictionary<string> = {};
export async function loadEnvironment(): Promise<void> {
    const lines = preprocessEnv(await executeCommandWithShellConfig(loginShell.environmentCommand));

    lines.forEach(line => {
        const [key, ...valueComponents] = line.trim().split("=");
        const value = valueComponents.join("=");

        if (!isIgnoredEnvironmentVariable(key)) {
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

    get cdpath(): FullPath[] {
        return _.uniq((this.get("CDPATH") || ".").split(delimiter).map(path => path || this.pwd).map(path => resolveDirectory(this.pwd, path)));
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
            updatedPaths => this.environment.set("PATH", updatedPaths.join(Path.delimiter)),
        );
    }
}
