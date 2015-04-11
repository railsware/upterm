/// <reference path="references.ts" />

var React = require('react')
var _: _.LoDashStatic = require('lodash');

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

        render(uniqueKey: string): any {
            debugger;
            return React.DOM.span( {className: this.getClassNames(), key: uniqueKey }, this.char);
        }

        toString(): string {
            return this.char;
        }

        isSpecial(): boolean {
            // http://www.asciitable.com/index/asciifull.gif
            return this.getCharCode() < 32 || this.getCharCode() > 126;
        }

        getClassNames(): string {
            var classes = [];
            _.forOwn(this.attributes, (value, key) => {
                if (value === true) {
                    classes.push(key);
                } else if (typeof value == 'number') {
                    classes.push(BlackScreen[_.capitalize(key)][value].toLowerCase());
                }
            });
            return classes.join(' ');
        }
    }
}
