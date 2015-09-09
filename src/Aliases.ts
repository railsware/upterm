var stripAnsi = require('strip-ansi');

import pty = require('pty.js');
import _ = require('lodash');

class Aliases {
    static aliases: _.Dictionary<string>;

    static initialize(): void {
        this.aliases = {};
        this.importAliasesFrom('zsh');
    }

    static find(alias: string): string {
        return this.aliases[alias];
    }

    static importAliasesFrom(shellName: string): void {
        if (process.platform === 'win32') return;

        var zsh = pty.spawn(shellName, ['-i', '-c', 'alias'], {env: process.env});

        var aliases = '';
        zsh.on('data', (text: string) => aliases += stripAnsi( text.toString() ));
        zsh.on('exit', () => {
            aliases.split('\n').forEach((alias: string) => {
                var split = alias.split('=');
                this.aliases[split[0]] = /'?([^']*)'?/.exec(split[1])[1];
            });
        });
    }
}

Aliases.initialize();

export = Aliases;
