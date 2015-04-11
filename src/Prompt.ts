/// <reference path="references.ts" />

module BlackScreen {

    export class Prompt extends EventEmitter {
        private buffer: Buffer;
        history: any;

        constructor(private directory: string) {
            super();

            this.buffer = new Buffer();
            this.buffer.on('data', () => { this.emit('data'); });

            this.history = History;
        }

        send(value: string): void {
            for(var i = 0; i != value.length; i++) {
                this.buffer.write(value.charAt(i));
            }

            this.history.append(value);
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
