import {delimiter} from "path";
import {executeCommandWithShellConfig} from "./PTY";
import {clone} from "lodash";
import {homeDirectory} from "./utils/Common";
import * as Path from "path";

const env: Dictionary<string> = {};
export async function loadEnvironment(): Promise<void> {
    const lines = await executeCommandWithShellConfig("env");

    lines.forEach(line => {
        let [key, value] = line.trim().split("=");
        env[key] = value;
    });
}

export class Environment {
    private storage: Dictionary<string> = clone(env);

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

export class EnvironmentPath {
    constructor(private environment: Environment) {
    }

    append(path: string) {
        if (!this.has(path)) {
            this.environment.set("PATH", this.raw + Path.delimiter + path);
        }
    }

    prepend(path: string) {
        if (!this.has(path)) {
            this.environment.set("PATH", path + Path.delimiter + this.raw);
        }
    }

    get split() {
        return this.raw.split(Path.delimiter);
    }

    remove(toRemove: string) {
        this.removeWhere(existing => existing !== toRemove);
    }

    removeWhere(remover: (existing: string) => boolean) {
        this.environment.set("PATH", this.split.filter(remover).join(Path.delimiter));
    }

    private has(path: string) {
        return this.split.includes(path);
    }

    private get raw() {
        return this.environment.get("PATH");
    }
}
