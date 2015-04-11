/// <reference path="references.ts" />

module BlackScreen {

    export class Prompt extends EventEmitter {
        buffer: Buffer;

        constructor(private directory: string, private history: History) {
            super();

            this.buffer = new Buffer();

            this.buffer.on('data', () => { this.emit('data'); });

            this.on('key-down', (event: KeyboardEvent) => {
                debugger;
                this.buffer.write(new Char(String.fromCharCode(event.keyCode)));
            });
        }

        send(value: string): void {
            for(var i = 0; i != value.length; i++) {
                this.buffer.write(new Char(value.charAt(i)));
            }

            this.emit('send');
        }

        getCommand(): string {
            return this.expandCommand(this.buffer.toString())[0];

        }

        getArguments(): Array<string> {
            return this.expandCommand(this.buffer.toString()).slice(1);
        }

        private expandCommand(command: string): Array<string> {
            // Split by comma, but not inside quotes.
            // http://stackoverflow.com/questions/16261635/javascript-split-string-by-space-but-ignore-space-in-quotes-notice-not-to-spli
            var parts = command.match(/(?:[^\s']+|'[^']*')+/g);
            var commandName = parts.shift();

            var alias: string = Aliases.find(commandName);

            if (alias) {
                parts = this.expandCommand(alias).concat(parts);
            } else {
                parts.unshift(commandName);
            }

            return parts;
        }
    }
}
