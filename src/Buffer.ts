import * as events from 'events';
import Char from './Char';
import Cursor from './Cursor';
import * as React from 'react';
import * as i from './Interfaces';
import * as e from './Enums';
import * as _ from 'lodash';
import Utils from './Utils';
import {List} from 'immutable';

export default class Buffer extends events.EventEmitter {
    private storage = List<List<Char>>();
    public cursor: Cursor = new Cursor();
    public activeBuffer = e.Buffer.Standard;
    private attributes: i.Attributes = { color: e.Color.White, weight: e.Weight.Normal };
    private isOriginModeSet = false;
    private _margins: Margins = {};

    constructor(private _dimensions: Dimensions) {
        super();
    }

    writeString(string: string, attributes = this.attributes): void {
        for (var i = 0; i !== string.length; ++i) {
            this.write(string.charAt(i), attributes);
        }
    }

    setTo(string: string, attributes = this.attributes): void {
        this.clear();
        this.writeString(string, attributes)
    }

    write(char: string, attributes = this.attributes): void {
        var charObject = Char.flyweight(char, this.getAttributes());

        if (charObject.isSpecial()) {
            switch (charObject.getCharCode()) {
                case e.CharCode.Bell:
                    if (window.DEBUG) {
                        Utils.playBell();
                    }

                    Utils.log('bell');
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
                    Utils.error(`Couldn't write a special char '${charObject}' with char code ${charObject.toString().charCodeAt(0)}.`);
            }
        } else {
            this.set(this.cursorPosition, charObject);
            this.moveCursorRelative({ horizontal: 1 });
        }

        this.emit('data');
    }

    scrollUp(count: number, addAtLine: number) {
        this.storage = this.storage.splice(this._margins.bottom - count + 1, count).toList();
        Utils.times(count, () => this.storage = this.storage.splice(addAtLine, 0, List<Char>()).toList());
    }

    scrollDown(count: number, deletedLine = this._margins.top) {
        Utils.times(count, () => this.storage = this.storage.splice(this._margins.bottom + 1, 0, List<Char>()).toList());
        this.storage = this.storage.splice(deletedLine, count).toList();
    }

    getAttributes(): i.Attributes {
        return _.clone(this.attributes);
    }

    setAttributes(attributes: i.Attributes): void {
        this.attributes = _.merge(this.attributes, attributes);
    }

    toArray(): Array<List<Char>> {
        let storage = this.storage;

        if (this.cursor.getShow() || this.cursor.getBlink()) {
            if (!storage.has(this.cursorPosition.row)) {
                storage = storage.set(this.cursorPosition.row, List<Char>());
            }

            let char = this.storage.getIn([this.cursorPosition.row, this.cursorPosition.column]) || Char.empty;
            storage = storage.setIn([this.cursorPosition.row, this.cursorPosition.column], Char.flyweight(char.toString(), _.merge(char.getAttributes(), { cursor: true })));
        }

        return storage.toArray();
    }

    toLines(): string[] {
        return this.storage.map(row => row.map(char => char.toString()).join('')).toArray();
    }

    toString(): string {
        return this.toLines().join('\n');
    }

    showCursor(state: boolean): void {
        this.cursor.setShow(state);
        this.emit('data');
    }

    blinkCursor(state: boolean): void {
        this.cursor.setBlink(state);
        this.emit('data');
    }

    moveCursorRelative(position: Advancement): Buffer {
        this.cursor.moveRelative(position);
        this.emit('data');

        return this;
    }

    moveCursorAbsolute(position: RowColumn): Buffer {
        this.cursor.moveAbsolute(position, this.homePosition);
        this.emit('data');

        return this;
    }

    clearRow() {
        this.storage = this.storage.set(this.cursorPosition.row, List<Char>());
        this.emit('data');
    }

    clearRowToEnd() {
        this.storage = this.storage.update(
            this.cursorPosition.row,
            List<Char>(),
            (row: List<Char>) => row.take(this.cursorPosition.column).toList()
        );
        this.emit('data');
    }

    clearRowToBeginning() {
        let replacement = new Array(this.cursorPosition.column).fill(Char.empty);
        this.storage = this.storage.update(
            this.cursorPosition.row,
            row => row.splice(0, this.cursorPosition.column + 1, replacement).toList())
        ;
        this.emit('data');
    }

    clear() {
        this.storage = List<List<Char>>();
        this.moveCursorAbsolute({ row: 0, column: 0 });
    }

    clearToBeginning() {
        this.clearRowToBeginning();

        this.storage = this.storage.splice(
            0,
            this.cursorPosition.row,
            new Array(this.cursorPosition.row).fill(List<Char>())
        ).toList();

        this.emit('data');
    }

    clearToEnd() {
        this.clearRowToEnd();
        this.storage.splice(this.cursorPosition.row + 1, Number.MAX_VALUE);
        this.emit('data');
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
