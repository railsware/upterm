/// <reference path="references.ts" />

import Utils = require("./Utils");
var React = require('react');
import i = require('./Interfaces');
import e = require('./Enums');
import _ = require('lodash');
import {memoize} from "./Decorators";

class Char {
    @memoize()
    static flyweight(char: string, attributes: i.Attributes) {
        return new Char(char, attributes);

    }
    constructor(private char: string, private attributes: i.Attributes) {
        if (char.length != 1) {
            throw(`Char can be created only from a single character; passed ${char.length}: ${char}`);
        }
    }

    getCharCode(): e.CharCode {
        return (<any>e.CharCode)[e.CharCode[this.char.charCodeAt(0)]];
    }

    getAttributes(): i.Attributes {
        return _.clone(this.attributes);
    }

    toString(): string {
        return this.char;
    }

    isSpecial(): boolean {
        // http://www.asciitable.com/index/asciifull.gif
        var charCode = this.char.charCodeAt(0);
        return charCode < 32;
    }
}

export = Char
