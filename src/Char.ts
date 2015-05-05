/// <reference path="references.ts" />

var React = require('react');

module BlackScreen {
    export enum CharCode {
        NewLine = 10,
        CarriageReturn = 13
    }

    export class Char {
        constructor(private char: string, private attributes: Attributes) {
            if (char.length != 1) {
                throw(`Char can be created only from a single character; passed ${char.length}: ${char}`);
            }
        }

        getCharCode(): CharCode {
            return (<any>CharCode)[CharCode[this.char.charCodeAt(0)]];
        }

        getAttributes(): Attributes {
            return this.attributes;
        }

        toString(): string {
            return this.char;
        }

        isSpecial(): boolean {
            // http://www.asciitable.com/index/asciifull.gif
            return this.getCharCode() < 32 || this.getCharCode() > 126;
        }
    }
}
