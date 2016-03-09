import {delimiter} from "path";

export default class Environment {
    private storage: Dictionary<string> = process.env;

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

    get path(): string {
        return this.get("PATH");
    }

    cdpath(pwd: string): string[] {
        return (this.get("CDPATH") || "").split(delimiter).map(path => path || pwd);
    }
}
