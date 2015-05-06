/// <reference path="references.ts" />

var React = require('react');
import i = require('Interfaces');
import e = require('Enums');

class Char {
    constructor(private char: string, private attributes: i.Attributes) {
        if (char.length != 1) {
            throw(`Char can be created only from a single character; passed ${char.length}: ${char}`);
        }
    }

    getCharCode(): e.CharCode {
        return (<any>e.CharCode)[e.CharCode[this.char.charCodeAt(0)]];
    }

    getAttributes(): i.Attributes {
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

export = Char
