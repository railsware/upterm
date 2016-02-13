import * as e from "./Enums";
import * as _ from "lodash";
import {memoize} from "./Decorators";
import {Attributes} from "./Interfaces";

export const attributesFlyweight = _.memoize(
    (attributes: Attributes): Attributes => _.clone(attributes),
    (attributes: Dictionary<any>) => {
        const ordered: Dictionary<any> = {};
        Object.keys(attributes).sort().forEach(key => ordered[key] = attributes[key]);
        return JSON.stringify(ordered);
    }
);

export default class Char {
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

    getCharCode(): e.KeyCode {
        return (<any>e.KeyCode)[e.KeyCode[this.char.charCodeAt(0)]];
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
