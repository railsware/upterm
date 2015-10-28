/// <reference path="references.ts" />

import Utils from './Utils';
var React = require('react');
import * as i from './Interfaces';
import * as e from './Enums';
import * as _ from 'lodash';
import {memoize} from "./Decorators";

export default class Char {
    static empty = Char.flyweight(' ', {});

    @memoize()
    static flyweight(char: string, attributes: i.Attributes) {
        return new Char(char, attributes);

    }

    constructor(private char: string, private attributes: i.Attributes) {
        if (char.length !== 1) {
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
