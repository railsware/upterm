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

        //addKeysHandler() {
        //    Terminal.currentInput().keydown(function (e: JQueryKeyEventObject) {
        //        if (e.which === 13) {
        //            this.shell.execute(Terminal.currentInput().val());
        //            return false;
        //        }
        //
        //        // Ctrl+P, ↑.
        //        if ((e.ctrlKey && e.keyCode === 80) || e.keyCode === 38) {
        //            Terminal.currentInput().val(this.shell.history.previous());
        //
        //            return false;
        //        }
        //
        //        // Ctrl+N, ↓.
        //        if ((e.ctrlKey && e.keyCode === 78) || e.keyCode === 40) {
        //            Terminal.currentInput().val(this.shell.history.next());
        //
        //            return false;
        //        }
        //    }.bind(this));
        //}

        resize(dimensions: Dimensions): void {
            this.invocations.forEach((invocation) => {
                invocation.resize(dimensions);
            });
        }
    }
}

module.exports = BlackScreen.Terminal;
