import Terminal from "./Terminal";
import * as i from "./Interfaces";

export default class Application {
    private _terminals: Terminal[] = [];
    private _contentSize: i.Size;
    private _charSize: i.Size;
    private _activeTerminalIndex: number;

    constructor(charSize: i.Size, windowSize: i.Size) {
        this._charSize = charSize;
        this.contentSize = windowSize;

        this.addTerminal();
    }

    get terminals() {
        return this._terminals;
    }

    get activeTerminal(): Terminal {
        return this.terminals[this._activeTerminalIndex];
    }

    addTerminal(): void {
        let terminal = new Terminal(this.contentDimensions);
        this.terminals.push(terminal);
        this.activateTerminal(terminal);
    }

    activateTerminal(terminal: Terminal): void {
        this._activeTerminalIndex = this.terminals.indexOf(terminal);
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
