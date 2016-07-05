import * as events from "events";
import {Char, attributesFlyweight, defaultAttributes} from "./Char";
import {Cursor} from "./Cursor";
import * as i from "./Interfaces";
import * as e from "./Enums";
import {List} from "immutable";
import {error, times, assign} from "./utils/Common";

export class ScreenBuffer extends events.EventEmitter {
    public static hugeOutputThreshold = 300;
    public cursor: Cursor = new Cursor();
    public activeScreenBufferType = e.ScreenBufferType.Standard;
    private storage = List<List<Char>>();
    private _attributes: i.Attributes = assign(defaultAttributes, {color: e.Color.White, weight: e.Weight.Normal});
    private isOriginModeSet = false;
    private isCursorKeysModeSet = false;
    private _margins: Margins = {top: 0, left: 0};

    constructor() {
        super();
    }

    writeMany(value: string): void {
        for (let i = 0; i !== value.length; ++i) {
            this.writeOne(value.charAt(i));
        }
    }

    writeOne(char: string): void {
        const charObject = Char.flyweight(char, this.attributes);

        if (charObject.isSpecial()) {
            switch (charObject.keyCode) {
                case e.KeyCode.Bell:
                    break;
                case e.KeyCode.Backspace:
                    this.moveCursorRelative({horizontal: -1});
                    break;
                case e.KeyCode.Tab:
                    this.moveCursorAbsolute({column: Math.floor((this.cursor.column + 8) / 8) * 8});
                    break;
                case e.KeyCode.NewLine:
                    if (this.cursor.row === this._margins.bottom) {
                        this.scrollUp(1);
                    } else {
                        this.moveCursorRelative({vertical: 1});
                    }

                    break;
                case e.KeyCode.CarriageReturn:
                    this.moveCursorAbsolute({column: 0});
                    break;
                default:
                    error(`Couldn't write a special char "${charObject}" with char code ${charObject.toString().charCodeAt(0)}.`);
            }
        } else {
            this.set(this.cursorPosition, charObject);
            this.moveCursorRelative({horizontal: 1});
        }
        this.emitData();
    }

    scrollDown(count: number) {
        this.storage = this.storage.splice(this._margins.bottom - count + 1, count).toList();
        times(count, () => this.storage = this.storage.splice(this.cursor.row, 0, undefined).toList());
    }

    scrollUp(count: number, deletedLine = this._margins.top) {
        times(count, () => this.storage = this.storage.splice(this._margins.bottom + 1, 0, undefined).toList());
        this.storage = this.storage.splice(deletedLine, count).toList();
    }

    get attributes(): i.Attributes {
        return this._attributes;
    }

    resetAttributes(): void {
        this._attributes = defaultAttributes;
    }

    setAttributes(attributes: i.Attributes): void {
        this._attributes = attributesFlyweight(assign(this._attributes, attributes));
    }

    toRenderable(status: e.Status, fromStorage = this.storage): List<List<Char>> {
        let storage = fromStorage;

        if (status === e.Status.InProgress && (this.cursor.show || this.cursor.blink)) {
            const cursorRow = this.cursorPosition.row - (this.storage.size - fromStorage.size);
            const cursorColumn = this.cursorPosition.column;

            const cursorCoordinates = [cursorRow, cursorColumn];

            if (!storage.get(cursorRow)) {
                storage = storage.set(cursorRow, List<Char>(Array(cursorColumn).fill(Char.empty)));
            }


            if (!storage.getIn(cursorCoordinates)) {
                storage = storage.setIn(cursorCoordinates, Char.empty);
            }

            let char: Char = storage.getIn(cursorCoordinates);
            storage = storage.setIn(
                cursorCoordinates,
                Char.flyweight(char.toString(), assign(char.attributes, {cursor: true}))
            );
        }

        return storage;
    }

    toCutRenderable(status: e.Status): List<List<Char>> {
        return this.toRenderable(status, <List<List<Char>>>(this.storage.takeLast(ScreenBuffer.hugeOutputThreshold)));
    }

    toLines(): string[] {
        return this.storage.map(row => {
            if (row) {
                return row.map(char => {
                    if (char) {
                        return char.toString();
                    } else {
                        return " ";
                    }
                }).join("");
            } else {
                return "";
            }
        }).toArray();
    }

    toString(): string {
        return this.toLines().join("\n");
    }

    showCursor(state: boolean): void {
        this.ensureRowExists(this.cursor.row);
        this.cursor.show = state;
        this.emitData();
    }

    blinkCursor(state: boolean): void {
        this.ensureRowExists(this.cursor.row);
        this.cursor.blink = state;
        this.emitData();
    }

    moveCursorRelative(position: Advancement): this {
        this.cursor.moveRelative(position);
        this.ensureRowExists(this.cursor.row);
        this.emitData();

        return this;
    }

    moveCursorAbsolute(position: PartialRowColumn): this {
        this.cursor.moveAbsolute(position, this.homePosition);
        this.ensureRowExists(this.cursor.row);
        this.emitData();

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
        this.emitData();
    }

    clearRow() {
        this.storage = this.storage.set(this.cursorPosition.row, List<Char>());
        this.emitData();
    }

    clearRowToEnd() {
        if (this.storage.get(this.cursorPosition.row)) {
            this.storage = this.storage.update(
                this.cursorPosition.row,
                List<Char>(),
                (row: List<Char>) => row.take(this.cursorPosition.column).toList()
            );
        }
        this.emitData();
    }

    clearRowToBeginning() {
        if (this.storage.get(this.cursorPosition.row)) {
            const replacement = Array(this.cursorPosition.column).fill(Char.empty);
            this.storage = this.storage.update(
                this.cursorPosition.row,
                row => row.splice(0, this.cursorPosition.column + 1, ...replacement).toList());
        }
        this.emitData();
    }

    clear() {
        this.storage = List<List<Char>>();
        this.moveCursorAbsolute({row: 0, column: 0});
    }

    clearToBeginning() {
        this.clearRowToBeginning();
        const replacement = Array(this.cursorPosition.row);

        this.storage = this.storage.splice(0, this.cursorPosition.row, ...replacement).toList();
        this.emitData();
    }

    clearToEnd() {
        this.clearRowToEnd();
        this.storage.splice(this.cursorPosition.row + 1, Number.MAX_VALUE);
        this.emitData();
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

    set originMode(mode: boolean) {
        this.isOriginModeSet = mode;
    }

    set cursorKeysMode(mode: boolean) {
        this.isCursorKeysModeSet = mode;
    }

    get cursorKeysMode(): boolean {
        return this.isCursorKeysModeSet;
    }

    set margins(margins: PartialMargins) {
        this._margins = assign(this._margins, margins);
    }

    get marginTop(): number {
        return this._margins.top;
    }

    at(position: RowColumn): Char {
        return this.storage.getIn([position.row, position.column]);
    }

    private get homePosition(): RowColumn {
        if (this.isOriginModeSet) {
            return {row: this._margins.top || 0, column: this._margins.left || 0};
        } else {
            return {row: 0, column: 0};
        }
    }

    private set(position: RowColumn, char: Char): void {
        this.ensureRowExists(position.row);
        this.storage = this.storage.setIn([position.row, position.column], char);
    }

    private ensureRowExists(rowNumber: number): void {
        if (!this.storage.get(rowNumber)) {
            this.storage = this.storage.set(rowNumber, List<Char>());
        }
    }

    private emitData() {
        this.emit("data");
    };
}
