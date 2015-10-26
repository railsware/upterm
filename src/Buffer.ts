import * as events from 'events';
import Char from './Char';
import Cursor from './Cursor';
import * as React from 'react';
import * as i from './Interfaces';
import * as e from './Enums';
import * as _ from 'lodash';
import Utils from './Utils';
import {memoize} from "./Decorators";

export default class Buffer extends events.EventEmitter {
    private _storage: Array<Array<Char>> = [];
    public cursor: Cursor = new Cursor();
    public activeBuffer = 'standard';
    private attributes: i.Attributes = {color: e.Color.White, weight: e.Weight.Normal};
    private isOriginModeSet = false;
    private margins: i.Margins = {};

    constructor(private dimensions: i.Dimensions) {
        super();
    }

    public get storage(): Array<Array<Char>> {
        return this._storage;
    }

    @memoize((row: Array<Char>, index: number, cursor: Cursor): any[] => {
        var key: any[] = [row, index];

        if (cursor.getPosition().row === index) {
            key = key.concat([cursor.getPosition(), cursor.getBlink(), cursor.getShow()]);
        }

        // TODO: A possible performance optimization opportunity.
        // TODO: Make sure vim movements work after modifying.
        return [JSON.stringify(key)];
    })
    renderRow(row: Array<Char>, index: number, cursor: Cursor): any {
        var consecutive: Array<any> = [];
        var current = {attributes: <i.Attributes>null, text: ''};
        var cursorPosition = cursor.getPosition();

        /* Quick fix for the strange character at the end (https://github.com/black-screen/black-screen/pull/56#issuecomment-139653723) */
        if (process.platform === 'win32' && row.length < 1) return;

        if (index == cursorPosition.row && this.cursor.getShow()) {
            var rowWithCursor: Char[] = [];

            for (var i = 0; i !== row.length; ++i) {
                var old = row[i];
                if (old) {
                    rowWithCursor[i] = Char.flyweight(old.toString(), old.getAttributes());
                }
            }
            // TODO: change accordingly to the theme background color.
            var cursorAttributes = {'background-color': e.Color.White, color: e.Color.Black};

            if (rowWithCursor[cursorPosition.column]) {
                var char = rowWithCursor[cursorPosition.column];
                var newChar = Char.flyweight(char.toString(), _.merge(char.getAttributes(), cursorAttributes));
            } else {
                newChar = Char.flyweight(' ', cursorAttributes);
            }

            rowWithCursor[cursorPosition.column] = newChar;
        } else {
            rowWithCursor = row;
        }

        // Foreach "merges" consecutive undefined.
        for (var i = 0, l = rowWithCursor.length; i !== l; i++) {
            var element = rowWithCursor[i];

            if (element) {
                var attributes = element.getAttributes();
                var value = element.toString();
            } else {
                attributes = {};
                value = ' ';
            }

            if (_.isEqual(attributes, current.attributes)) {
                current.text += value;
                current.attributes = attributes;
            } else {
                consecutive.push(current);
                current = {attributes: attributes, text: value};
            }
        }

        consecutive.push(current);

        var children = consecutive.map((group, groupIndex) =>
                React.createElement(
                    'span',
                    _.merge(this.getHTMLAttributes(group.attributes), {key: `group-${groupIndex}`}),
                    group.text
                )
        );

        return React.createElement('div', {className: 'row', key: `row-${index}`}, null, ...children);
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
                    if ((<any>window)['DEBUG']) {
                        var audio = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");
                        audio.play();
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
            this.set(this.cursor.getPosition(), charObject);
            this.cursor.next();
        }

        this.emit('data');
    }

    scrollUp(count, addAtLine) {
        this._storage.splice(this.margins.bottom - count + 1, count);
        Utils.times(count, () => this._storage.splice(addAtLine, 0, []));
    }

    scrollDown(count, deletedLine = this.margins.top) {
        Utils.times(count, () => this._storage.splice(this.margins.bottom + 1, 0, []));
        this._storage.splice(deletedLine, count);
    }

    getAttributes(): i.Attributes {
        return _.clone(this.attributes);
    }

    setAttributes(attributes: i.Attributes): void {
        this.attributes = _.merge(this.attributes, attributes);
    }

    toString(): string {
        return this.toLines().join('\n');
    }

    toLines(): string[] {
        return this.map((row) => {
            return row.map((char) => {
                return char.toString();
            }).join('')
        });
    }

    map<R>(callback: (row: Array<Char>, index: number) => R): R[] {
        var mapped = [];
        for (let i = 0; i !== this._storage.length; ++i) {
            mapped.push(callback(this._storage[i], i));
        }
        return mapped
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
        var cursorPosition = this.cursor.getPosition();
        this._storage[cursorPosition.row] = null;
        this.emit('data');
    }

    clearRowToEnd() {
        var cursorPosition = this.cursor.getPosition();
        var row = this._storage[cursorPosition.row];

        if (row) {
            row.splice(cursorPosition.column, Number.MAX_VALUE);
        }
        this.emit('data');
    }

    clearRowToBeginning() {
        var cursorPosition = this.cursor.getPosition();
        var row = this._storage[cursorPosition.row];

        if (row) {
            for (var i = 0; i <= cursorPosition.column; ++i) {
                row[i] = null;
            }
        }
        this.emit('data');
    }

    clear() {
        this._storage = [];
        this.moveCursorAbsolute({horizontal: 0, vertical: 0});
        this.emit('data');
    }

    clearToBeginning() {
        var cursorPosition = this.cursor.getPosition();
        this.clearRowToBeginning();

        for (var i = 0; i !== cursorPosition.row; ++i) {
            this._storage[i] = [];
        }
        this.emit('data');
    }

    clearToEnd() {
        var cursorPosition = this.cursor.getPosition();
        this.clearRowToEnd();
        this._storage.splice(cursorPosition.row + 1, Number.MAX_VALUE);
        this.emit('data');
    }

    isEmpty(): boolean {
        return this._storage.length === 0;
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
        let row = this._storage[position.row];
        return row && row[position.column];
    }

    private get homePosition(): i.Position {
        if (this.isOriginModeSet) {
            return {row: this.margins.top || 0, column: this.margins.left || 0};
        } else {
            return {row: 0, column: 0};
        }
    }

    private getHTMLAttributes(attributes: i.Attributes): Object {
        var htmlAttributes: _.Dictionary<any> = {};
        _.each(attributes, (value, key) => {
            htmlAttributes[`data-${key}`] = value;
        });

        return htmlAttributes;
    }

    private set(position: i.Position, char: Char): void {
        if (!this.hasRow(position.row)) {
            this.addRow(position.row);
        }

        this._storage[position.row][position.column] = char;
    }

    private addRow(row: number): void {
        this._storage[row] = []
    }

    private hasRow(rowIndex: number): boolean {
        var row = this._storage[rowIndex];
        return row && (typeof row === 'object');
    }
}
