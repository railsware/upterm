import {Suggestion} from "../../Interfaces";

abstract class BaseOption extends Suggestion {
    get type() {
        return "option";
    }
}

export class Option extends BaseOption {
    constructor(protected _name: string, protected _synopsis: string, protected _description: string) {
        super();
    };

    get value() {
        return `--${this._name}`;
    }

    get displayValue() {
        return `-${this._name[0]} ${this.value}`;
    }

    get description() {
        return this._description;
    }

    get synopsis() {
        return this._synopsis;
    }
}

export class ShortOption extends BaseOption {
    constructor(protected _name: string, protected _synopsis: string, protected _description: string) {
        super();
    };

    get value() {
        return `-${this._name}`;
    }

    get description() {
        return this._description;
    }

    get synopsis() {
        return this._synopsis;
    }
}
