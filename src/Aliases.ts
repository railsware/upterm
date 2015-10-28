import * as pty from 'ptyw.js';
import * as _ from 'lodash';
import PTY from "./PTY";

export default class Aliases {
    static aliases: _.Dictionary<string>;

    static initialize(): void {
        this.aliases = {};
        this.importAliases();
    }

    static find(alias: string): string {
        return this.aliases[alias];
    }

    private static importAliases(shellName: string = process.env.SHELL): void {
        if (process.platform === 'win32') return;

        let aliases = '';
        new PTY(
            shellName, ['-i', '-c', 'alias'], process.env.HOME, {columns: 80, rows: 20},
            (text: string) => aliases += text,
            (exitCode: number) => aliases.split('\n').forEach(alias => {
                let split = alias.split('=');

                let name = /(alias )?(.*)/.exec(split[0])[2];
                let value = /'?([^']*)'?/.exec(split[1])[1];

                this.aliases[name] = value;
            })
        );
    }
}

Aliases.initialize();
