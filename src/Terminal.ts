/// <reference path="references.ts" />

module BlackScreen {
    export class Terminal extends EventEmitter {
        invocations: Array<Invocation>;
        currentDirectory: string;
        history: History;

        constructor(private dimensions: Dimensions) {
            super();
            this.currentDirectory = process.env.HOME;
            this.invocations = [];
            this.history = new History();

            Aliases.initialize();

            this.createInvocation();
        }

        createInvocation(): void {
            var invocation = new Invocation(this.currentDirectory, this.dimensions, this.history);
            invocation.once('end', () => {
                this.createInvocation();
            }).once('working-directory-changed', (newWorkingDirectory: string) => {
                this.currentDirectory = newWorkingDirectory;
            });
            this.invocations = this.invocations.concat(invocation);
            this.emit('invocation');
        }

        resize(dimensions: Dimensions): void {
            this.dimensions = dimensions;

            this.invocations.forEach((invocation) => {
                invocation.resize(dimensions);
            });
        }
    }
}

module.exports = BlackScreen.Terminal;
