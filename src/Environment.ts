export default class Environment {
    private storage: Dictionary<string> = process.env;

    set(key: string, value: string): void {
        this.storage[key] = value;
    }

    toObject(): Dictionary<string> {
        return this.storage;
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
}
