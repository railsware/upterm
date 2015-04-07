/// <reference path="references.ts" />

module BlackScreen {
    export class Char {
        constructor(private char: string) {
            if (char.length != 1) {
                throw(`Char can be created only from a single character; passed ${char.length}: ${char}`)
            }
        }

        toString(): string {
            return this.char;
        }

        isNewLine(): boolean {
            return this.char == '\n';
        }
    }
}
