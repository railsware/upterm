import Terminal from "./Terminal";
import * as i from "./Interfaces";

export default class Application {
    private _terminals: Terminal[] = [];
    private _contentSize: i.Size;
    private _charSize: i.Size;

    constructor(charSize: i.Size, windowSize: i.Size) {
        this._charSize = charSize;
        this.contentSize = windowSize;

        this.terminals.push(new Terminal(this.contentDimensions));
    }

    get terminals() {
        return this._terminals;
    }

    set contentSize(newSize) {
        this._contentSize = newSize;

        this.terminals.forEach(terminal => terminal.dimensions = this.contentDimensions)
    }

    get contentSize(): i.Size {
        return this._contentSize;
    }

    private get charSize() {
        return this._charSize
    }

    get contentDimensions(): i.Dimensions {
        return {
            columns: Math.floor(this.contentSize.width / this.charSize.width),
            rows: Math.floor(this.contentSize.height / this.charSize.height),
        };
    }
}
