import Terminal from "./Terminal";
import * as i from "./Interfaces";
const IPC = require('ipc');

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

    addTerminal(): Terminal {
        let terminal = new Terminal(this.contentDimensions);
        this.terminals.push(terminal);

        return terminal;
    }

    removeTerminal(terminal: Terminal): Application {
        _.pull(this.terminals, terminal);

        if (_(this.terminals).isEmpty()) {
            IPC.send('quit');
        }

        return this;
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
