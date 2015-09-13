import * as pty from 'ptyw.js';
import * as _ from 'lodash';

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
        
        var shell = pty.spawn(shellName, ['-i', '-c', 'alias'], {env: process.env});

        var aliases = '';
        shell.stdout.on('data', (text: string) => aliases += text.toString());
        shell.on('exit', () =>
            aliases.split('\n').forEach(alias => {
                let split = alias.split('=');

                let name = /(alias )?(.*)/.exec(split[0])[2];
                let value = /'?([^']*)'?/.exec(split[1])[1];

                this.aliases[name] = value;
            })
        );
    }
}

Aliases.initialize();
