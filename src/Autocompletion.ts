/// <reference path="references.ts" />

module BlackScreen {
    export class Autocompletion {
        pathCompletions: Providers.Command.Path;

        constructor() {
            this.pathCompletions = new Providers.Command.Path();
        }

        getCompletions(): Array<string> {
            return this.pathCompletions.executables;
        }

        matching(string: string): Array<string> {
            return _.filter(this.getCompletions(), (completion: string) => {
                return completion.startsWith(string);
            })
        }
    }
}
