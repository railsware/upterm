/// <reference path="references.ts" />

module BlackScreen {
    export class Terminal extends EventEmitter {
        invocations: Array<Invocation>;
        currentDirectory: string;
        history: History;
        private dimensions: Dimensions;

        constructor() {
            super();
            this.currentDirectory = process.env.HOME;
            this.dimensions = {columns: 120, rows: 40};
            this.invocations = [];
            this.history = new History();

            Aliases.initialize();

            this.createInvocation();
        }

        createInvocation(): void {
            var invocation = new Invocation(this.currentDirectory, this.dimensions, this.history);
            invocation.once('end', () => {
                this.createInvocation();
            });
            this.invocations = this.invocations.concat(invocation);
            this.emit('invocation');
        }

        resize(dimensions: Dimensions): void {
            this.invocations.forEach((invocation) => {
                invocation.resize(dimensions);
            });
        }
    }
}

module.exports = BlackScreen.Terminal;
