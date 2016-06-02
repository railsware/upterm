import * as _ from "lodash";
import {memoize} from "./Decorators";
import {Attributes} from "./Interfaces";
import {KeyCode} from "./Enums";

export const attributesFlyweight = _.memoize(
    (attributes: Attributes): Attributes => Object.freeze(Object.assign({}, attributes)),
    (attributes: Dictionary<any>) => {
        const ordered: Dictionary<any> = {};
        Object.keys(attributes).sort().forEach(key => ordered[key] = attributes[key]);
        return JSON.stringify(ordered);
    }
);

export class Char {
    static empty = Char.flyweight(" ", {});

    @memoize()
    static flyweight(char: string, attributes: Attributes) {
        return new Char(char, attributesFlyweight(attributes));

    }

    constructor(private char: string, private _attributes: Attributes) {
        if (char.length !== 1) {
            throw(`Char can be created only from a single character; passed ${char.length}: ${char}`);
        }
    }

    get keyCode(): KeyCode {
        return (<any>KeyCode)[KeyCode[this.char.charCodeAt(0)]];
    }

    get attributes(): Attributes {
        return this._attributes;
    }

    toString(): string {
        return this.char;
    }

    isSpecial(): boolean {
        // http://www.asciitable.com/index/asciifull.gif
        const charCode = this.char.charCodeAt(0);
        return charCode < 32;
    }
}
