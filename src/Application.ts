import Terminal from "./Terminal";
import * as _ from "lodash";
import * as events from "events";
const IPC = require("ipc");

export default class Application extends events.EventEmitter {
    private static _instance: Application;
    private _terminals: Terminal[] = [];
    private _contentSize: Size;
    private _charSize: Size;
    private _activeTerminalIndex: number;

    constructor() {
        super();

        if (Application._instance) {
            throw new Error("Use Application.instance instead.");
        }
    }

    static get instance(): Application {
        if (!Application._instance) {
            Application._instance = new Application();
        }
        return Application._instance;
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
        this.emit("terminal");

        return terminal;
    }

    removeTerminal(terminal: Terminal): Application {
        _.pull(this.terminals, terminal);
        this.emit("terminal");

        if (_.isEmpty(this.terminals)) {
            IPC.send("quit");
        }

        return this;
    }

    activateTerminal(terminal: Terminal): void {
        this._activeTerminalIndex = this.terminals.indexOf(terminal);
        this.emit("terminal");
    }

    set contentSize(newSize) {
        this._contentSize = newSize;

        this.terminals.forEach((terminal: Terminal) => terminal.dimensions = this.contentDimensions);
    }

    get contentSize(): Size {
        return this._contentSize;
    }

    get charSize() {
        return this._charSize;
    }

    set charSize(size: Size) {
        this._charSize = size;
    }

    get contentDimensions(): Dimensions {
        return {
            columns: Math.floor(this.contentSize.width / this.charSize.width),
            rows: Math.floor(this.contentSize.height / this.charSize.height),
        };
    }
}
