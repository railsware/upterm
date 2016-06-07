import {executeCommandWithShellConfig} from "./PTY";
import * as _ from "lodash";

export const aliasesFromConfig: Dictionary<string> = {};

export async function loadAliasesFromConfig(): Promise<void> {
    const lines = await executeCommandWithShellConfig("alias");

    lines.forEach(aliasLine => {
        let [short, long] = aliasLine.split("=");

        if (short && long) {
            const nameCapture = /(alias )?(.*)/.exec(short);
            const valueCapture = /'?([^']*)'?/.exec(long);

            if (nameCapture && valueCapture) {
                aliasesFromConfig[nameCapture[2]] = valueCapture[1];
            } else {
                throw `Alias line is incorrect: ${aliasLine}`;
            }
        } else {
            throw `Can't parse alias line: ${aliasLine}`;
        }
    });
}


export class Aliases {
    private storage: Dictionary<string>;

    constructor(aliases: Dictionary<string>) {
        this.storage = _.clone(aliases);
    }

    add(name: string, value: string) {
        this.storage[name] = value;
    }

    get(name: string): string | undefined {
        return this.storage[name];
    }

    getNameByValue(value: string): string | undefined {
        return _.findKey(this.storage, storageValue => storageValue === value);
    }

    remove(name: string, value: string) {
        delete this.storage[name];
    }

    toObject(): Dictionary<string> {
        return this.storage;
    }
}
