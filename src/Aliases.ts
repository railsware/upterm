var pty = require('pty.js');
import _ = require('lodash')

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
        var zsh = pty.spawn(shellName, ['-i', '-c', 'alias'], {env: process.env});

        var aliases = '';
        zsh.on('data', (text: string) => {
            aliases += text
        });

        zsh.on('end', () => {
            aliases.split('\n').forEach((alias: string) => {
                var split = alias.split('=');
                this.aliases[split[0]] = /'?([^']*)'?/.exec(split[1])[1];
            });
        });
    }
}

export = Aliases;
