import * as events from "events";
import Char from "./Char";
import Cursor from "./Cursor";
import * as i from "./Interfaces";
import * as e from "./Enums";
import * as _ from "lodash";
import Utils from "./Utils";
import {List} from "immutable";

export default class Buffer extends events.EventEmitter {
    public static hugeOutputThreshold = 300;
    public cursor: Cursor = new Cursor();
    public activeBuffer = e.Buffer.Standard;
    private storage = List<List<Char>>();
    private attributes: i.Attributes = { color: e.Color.White, weight: e.Weight.Normal };
    private isOriginModeSet = false;
    private _margins: Margins = {};

    constructor(private _dimensions: Dimensions) {
        super();
    }

    writeString(value: string, attributes = this.attributes): void {
        for (let i = 0; i !== value.length; ++i) {
            this.write(value.charAt(i), attributes);
        }
    }

    write(char: string, attributes = this.attributes): void {
        const charObject = Char.flyweight(char, this.getAttributes());

        if (charObject.isSpecial()) {
            switch (charObject.getCharCode()) {
                case e.CharCode.Bell:
                    if (window.DEBUG) {
                        Utils.playBell();
                    }

                    Utils.log("bell");
                    break;
                case e.CharCode.Backspace:
                    this.moveCursorRelative({ horizontal: -1 });
                    break;
                case e.CharCode.Tab:
                    this.moveCursorAbsolute({ column: Math.floor((this.cursor.column() + 8) / 8) * 8 });
                    break;
                case e.CharCode.NewLine:
                    if (this.cursor.row() === this._margins.bottom) {
                        this.scrollDown(1);
                    } else {
                        this.moveCursorRelative({ vertical: 1 }).moveCursorAbsolute({ column: 0 });
                    }

                    break;
                case e.CharCode.CarriageReturn:
                    this.moveCursorAbsolute({ column: 0 });
                    break;
                default:
                    Utils.error(`Couldn"t write a special char "${charObject}" with char code ${charObject.toString().charCodeAt(0)}.`);
            }
        } else {
            this.set(this.cursorPosition, charObject);
            this.moveCursorRelative({ horizontal: 1 });
        }

        this.emit("data");
    }

    scrollUp(count: number, addAtLine: number) {
        this.storage = this.storage.splice(this._margins.bottom - count + 1, count).toList();
        Utils.times(count, () => this.storage = this.storage.splice(addAtLine, 0, undefined).toList());
    }

    scrollDown(count: number, deletedLine = this._margins.top) {
        Utils.times(count, () => this.storage = this.storage.splice(this._margins.bottom + 1, 0, undefined).toList());
        this.storage = this.storage.splice(deletedLine, count).toList();
    }

    getAttributes(): i.Attributes {
        return _.clone(this.attributes);
    }

    setAttributes(attributes: i.Attributes): void {
        this.attributes = _.merge(this.attributes, attributes);
    }

    toRenderable(fromStorage = this.storage): List<List<Char>> {
        let storage = fromStorage;

        if (this.cursor.getShow() || this.cursor.getBlink()) {
            const coordinates = [this.cursorPosition.row, this.cursorPosition.column];

            if (!storage.get(this.cursorPosition.row)) {
                storage = storage.set(this.cursorPosition.row, List<Char>(Array(this.cursorPosition.column).fill(Char.empty)));
            }

            if (!storage.getIn(coordinates)) {
                storage = storage.setIn(coordinates, Char.empty);
            }

            let char: Char = storage.getIn(coordinates);
            storage = storage.setIn(
                coordinates,
                Char.flyweight(char.toString(), _.merge(_.clone(char.attributes), { cursor: true }))
            );
        }

        return storage;
    }

    toCutRenderable(): List<List<Char>> {
        return this.toRenderable(<List<List<Char>>>(this.storage.takeLast(Buffer.hugeOutputThreshold)));
    }

    toLines(): string[] {
        return this.storage.map(row => row.map(char => char.toString()).join("")).toArray();
    }

    toString(): string {
        return this.toLines().join("\n");
    }

    showCursor(state: boolean): void {
        this.cursor.setShow(state);
        this.emit("data");
    }

    blinkCursor(state: boolean): void {
        this.cursor.setBlink(state);
        this.emit("data");
    }

    moveCursorRelative(position: Advancement): Buffer {
        this.cursor.moveRelative(position);
        this.emit("data");

        return this;
    }

    moveCursorAbsolute(position: RowColumn): Buffer {
        this.cursor.moveAbsolute(position, this.homePosition);
        this.emit("data");

        return this;
    }

    eraseRight(n: number) {
        if (this.storage.get(this.cursorPosition.row)) {
            this.storage = this.storage.update(
                this.cursorPosition.row,
                List<Char>(),
                (row: List<Char>) => row.take(this.cursorPosition.column)
                                         .concat(Array(n).fill(Char.empty), row.skip(this.cursorPosition.column + n))
                                         .toList()
            );
        }
        this.emit("data");
    }

    clearRow() {
        this.storage = this.storage.set(this.cursorPosition.row, List<Char>());
        this.emit("data");
    }

    clearRowToEnd() {
        if (this.storage.get(this.cursorPosition.row)) {
            this.storage = this.storage.update(
                this.cursorPosition.row,
                List<Char>(),
                (row: List<Char>) => row.take(this.cursorPosition.column).toList()
            );
        }
        this.emit("data");
    }

    clearRowToBeginning() {
        if (this.storage.get(this.cursorPosition.row)) {
            const replacement = Array(this.cursorPosition.column).fill(Char.empty);
            this.storage = this.storage.update(
                this.cursorPosition.row,
                row => row.splice(0, this.cursorPosition.column + 1, ...replacement).toList());
        }
        this.emit("data");
    }

    clear() {
        this.storage = List<List<Char>>();
        this.moveCursorAbsolute({ row: 0, column: 0 });
    }

    clearToBeginning() {
        this.clearRowToBeginning();
        const replacement = Array(this.cursorPosition.row);

        this.storage = this.storage.splice(0, this.cursorPosition.row, ...replacement).toList();
        this.emit("data");
    }

    clearToEnd() {
        this.clearRowToEnd();
        this.storage.splice(this.cursorPosition.row + 1, Number.MAX_VALUE);
        this.emit("data");
    }

    get size(): number {
        return this.storage.size;
    }

    get cursorPosition(): RowColumn {
        return this.cursor.getPosition();
    }

    isEmpty(): boolean {
        return this.storage.size === 0;
    }

    set dimensions(dimensions: Dimensions) {
        this._dimensions = dimensions;
    }

    set originMode(mode: boolean) {
        this.isOriginModeSet = mode;
    }

    set margins(margins: Margins) {
        this._margins = margins;
    }

    at(position: RowColumn): Char {
        return this.storage.getIn([position.row, position.column]);
    }

    private get homePosition(): RowColumn {
        if (this.isOriginModeSet) {
            return { row: this._margins.top || 0, column: this._margins.left || 0 };
        } else {
            return { row: 0, column: 0 };
        }
    }

    private set(position: RowColumn, char: Char): void {
        if (!this.storage.get(position.row)) {
            this.storage = this.storage.set(position.row, List<Char>());
        }

        this.storage = this.storage.setIn([position.row, position.column], char);
    }
}
