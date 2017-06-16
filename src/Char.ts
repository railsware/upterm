import * as _ from "lodash";
import {Attributes} from "./Interfaces";
import {Brightness, Weight, Color} from "./Enums";

export const attributesFlyweight = _.memoize(
    (attributes: Attributes): Attributes => Object.freeze({...attributes}),
    (attributes: Dictionary<any>) => {
        const ordered: Dictionary<any> = {};
        Object.keys(attributes).sort().forEach(key => ordered[key] = attributes[key]);
        return JSON.stringify(ordered);
    },
);

export const defaultAttributes = Object.freeze({
    inverse: false,
    color: Color.White,
    backgroundColor: Color.Black,
    brightness: Brightness.Normal,
    weight: Weight.Normal,
    underline: false,
    crossedOut: false,
    blinking: false,
    cursor: false,
});

export interface Char {
    value: string;
    attributes: Attributes;
}

export function createChar(char: string, attributes: Attributes): Char {
    if (char.length !== 1) {
        throw(`Char can be created only from a single character; passed ${char.length}: ${char}`);
    }

    return {
        value: char,
        attributes: attributesFlyweight(attributes),
    };
}

export const space = createChar(" ", defaultAttributes);
