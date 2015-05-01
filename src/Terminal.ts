/// <reference path="references.ts" />

var fs = require('fs');

module BlackScreen {
    export class Terminal extends EventEmitter {
        invocations: Array<Invocation>;
        currentDirectory: string;
        history: History;

        private stateFileName = `${process.env.HOME}/.black-screen-state`;

        constructor(private dimensions: Dimensions) {
            super();

            this.restore();

            this.history = new History();
            Aliases.initialize();

            this.clearInvocations();
        }

        createInvocation(): void {
            var invocation = new Invocation(this.currentDirectory, this.dimensions, this.history);
            invocation.once('end', () => {
                this.createInvocation();
            }).once('working-directory-changed', (newWorkingDirectory: string) => {
                this.currentDirectory = newWorkingDirectory;
                this.serialize();
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

        clearInvocations(): void {
            this.invocations = [];
            this.createInvocation();
        }

        private serialize(): void {
            fs.writeFile(this.stateFileName, JSON.stringify({
                currentDirectory: this.currentDirectory
            }), (error: any) => {
                if (error) debugger;
            })
        }

        private restore(): void {
            try {
                var state = JSON.parse(fs.readFileSync(this.stateFileName));
            } catch (error) {
                state = {currentDirectory: process.env.HOME};
            }

            this.currentDirectory = state.currentDirectory;
        }
    }
}

module.exports = BlackScreen.Terminal;
