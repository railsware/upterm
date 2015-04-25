/// <reference path="references.ts" />

module BlackScreen {
    export class Utils {
        static log(...args: any[]): void {
            this.delegate('log', args);
        }

        static error(...args: any[]): void {
            this.delegate('error', args);
        }

        private static delegate(name: string, args: Array<any>): void {
            if ((<any>window)['DEBUG']) {
                (<any>console)[name](...args);
            }
        }
    }
}
