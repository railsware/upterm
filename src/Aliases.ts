import * as pty from 'ptyw.js';
import * as _ from 'lodash';
import {executeCommand} from "./PTY";
import {memoize} from "./Decorators"

export default class Aliases {
    private static aliases: _.Dictionary<string>;

    static get all(): _.Dictionary<string> {
        return this.aliases;
    }

    static find(alias: string): string {
        return this.aliases[alias];
    }

    static async load() {
        const output = await executeCommand(process.env.SHELL, ['-i', '-c', 'alias']);

        this.aliases = output.split('\n').reduce((accumulator: _.Dictionary<string>, aliasLine: string) => {
            let split = aliasLine.split('=');

            let name = /(alias )?(.*)/.exec(split[0])[2];
            let value = /'?([^']*)'?/.exec(split[1])[1];

            accumulator[name] = value;
            return accumulator
        }, <_.Dictionary<string>>{});
    }
}

Aliases.load();
