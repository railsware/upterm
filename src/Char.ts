/// <reference path="references.ts" />

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

        render(): string {
            var span: HTMLSpanElement = document.createElement("span");
            span.textContent = this.char;
            span.classList.add('underlined');
            return span.outerHTML;
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
