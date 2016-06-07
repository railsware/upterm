import {executeCommandWithShellConfig} from "./PTY";
import * as _ from "lodash";

export const aliasesFromConfig: Dictionary<string> = {};

export async function loadAliasesFromConfig(): Promise<void> {
    const lines = await executeCommandWithShellConfig("alias");

    lines.map(parseAlias).forEach(parsed => aliasesFromConfig[parsed.name] = parsed.value);
}

export function parseAlias(line: string) {
    let [short, long] = line.split("=");

    if (short && long) {
        const nameCapture = /(alias )?(.*)/.exec(short);
        const valueCapture = /'?([^']*)'?/.exec(long);

        if (nameCapture && valueCapture) {
            return {
                name: nameCapture[2],
                value: valueCapture[1],
            };
        } else {
            throw `Alias line is incorrect: ${line}`;
        }
    } else {
        throw `Can't parse alias line: ${line}`;
    }
}


export class Aliases {
    private storage: Dictionary<string>;

    constructor(aliases: Dictionary<string>) {
        this.storage = _.clone(aliases);
    }

    add(name: string, value: string) {
        this.storage[name] = value;
    }

    has(name: string): boolean {
        return name in this.storage;
    }

    get(name: string): string | undefined {
        return this.storage[name];
    }

    getNameByValue(value: string): string | undefined {
        return _.findKey(this.storage, storageValue => storageValue === value);
    }

    remove(name: string) {
        delete this.storage[name];
    }

    toObject(): Dictionary<string> {
        return this.storage;
    }
}
