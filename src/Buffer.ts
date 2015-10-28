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
    public activeBuffer = 'standard';
    private attributes: i.Attributes = {color: e.Color.White, weight: e.Weight.Normal};
    private isOriginModeSet = false;
    private margins: i.Margins = {};

    constructor(private dimensions: i.Dimensions) {
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
                    this.moveCursorRelative({horizontal: -1});
                    break;
                case e.CharCode.Tab:
                    this.moveCursorAbsolute({horizontal: Math.floor((this.cursor.column() + 8) / 8) * 8});
                    break;
                case e.CharCode.NewLine:
                    if (this.cursor.row() == this.margins.bottom) {
                        this.scrollDown(1);
                    } else {
                        this.moveCursorRelative({vertical: 1}).moveCursorAbsolute({horizontal: 0});
                    }

                    break;
                case e.CharCode.CarriageReturn:
                    this.moveCursorAbsolute({horizontal: 0});
                    break;
                default:
                    Utils.error(`Couldn't write a special char '${charObject}' with char code ${charObject.toString().charCodeAt(0)}.`);
            }
        } else {
            this.set(this.cursorPosition, charObject);
            this.advanceCursor();
        }

        this.emit('data');
    }

    private advanceCursor() {
        this.cursor.next();
        if (!this.storage.hasIn([this.cursorPosition.row, this.cursorPosition.column])) {
            this.set(this.cursorPosition, Char.flyweight(' ', {}));

        }
    };

    scrollUp(count, addAtLine) {
        this.storage = this.storage.splice(this.margins.bottom - count + 1, count).toList();
        Utils.times(count, () => this.storage = this.storage.splice(addAtLine, 0, []).toList());
    }

    scrollDown(count, deletedLine = this.margins.top) {
        Utils.times(count, () => this.storage = this.storage.splice(this.margins.bottom + 1, 0, []).toList());
        this.storage = this.storage.splice(deletedLine, count).toList();
    }

    getAttributes(): i.Attributes {
        return _.clone(this.attributes);
    }

    setAttributes(attributes: i.Attributes): void {
        this.attributes = _.merge(this.attributes, attributes);
    }

    toArray(): Array<List<Char>> {
        return this.storage.toArray();
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

    moveCursorRelative(position: i.Advancement): Buffer {
        this.cursor.moveRelative(position);
        this.emit('data');

        return this;
    }

    moveCursorAbsolute(position: i.Advancement): Buffer {
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
            (row: List<Char>) => row.take( this.cursorPosition.column).toList()
        );
        this.emit('data');
    }

    clearRowToBeginning() {
        let replacement = new Array(this.cursorPosition.column).fill(Char.flyweight(' ', {}));
        this.storage = this.storage.update(
            this.cursorPosition.row,
            row => row.splice(0, this.cursorPosition.column + 1, replacement).toList())
        ;
        this.emit('data');
    }

    clear() {
        this.storage = List<List<Char>>();
        this.moveCursorAbsolute({horizontal: 0, vertical: 0});
        this.emit('data');
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

    get cursorPosition(): i.Position {
        return this.cursor.getPosition();
    }

    isEmpty(): boolean {
        return this.storage.size === 0;
    }

    setDimensions(dimensions: i.Dimensions): void {
        this.dimensions = dimensions;
    }

    set originMode(mode: boolean) {
        this.isOriginModeSet = mode;
    }

    setMargins(margins: i.Margins): void {
        this.margins = margins;
    }

    at(position: i.Position): Char {
        return this.storage.getIn([position.row, position.column]);
    }

    private get homePosition(): i.Position {
        if (this.isOriginModeSet) {
            return {row: this.margins.top || 0, column: this.margins.left || 0};
        } else {
            return {row: 0, column: 0};
        }
    }

    private set(position: i.Position, char: Char): void {
        if (!this.storage.has(position.row)) {
            this.storage = this.storage.set(position.row, List<Char>());
        }

        this.storage = this.storage.setIn([position.row, position.column], char);
    }
}
