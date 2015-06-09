import events = require('events');
import Char = require('./Char');
import Cursor = require('./Cursor');
import React = require('react');
import i = require('./Interfaces');
import e = require('./Enums');
import _ = require('lodash');

class Buffer extends events.EventEmitter {
    private storage: Array<Array<Char>> = [];
    public cursor: Cursor = new Cursor();
    private attributes: i.Attributes = {color: e.Color.White, weight: e.Weight.Normal};
    private renderRow: Function;

    constructor() {
        super();

        this.renderRow = _.memoize((row: Array<Char>, index: number, cursorPosition: i.Position) => {
            var consecutive: Array<any> = [];
            var current = {attributes: <i.Attributes>null, text: ''};

            var rowWithCursor = row;

            if (index == cursorPosition.row && this.cursor.getShow()) {
                rowWithCursor = _.clone(row);
                var cursorAttributes = {'background-color': e.Color.White};

                if (rowWithCursor[cursorPosition.column]) {
                    var char = rowWithCursor[cursorPosition.column];
                    var newChar = new Char(char.toString(), _.merge(char.getAttributes(), cursorAttributes));
                } else {
                    newChar = new Char(' ', cursorAttributes);
                }

                rowWithCursor[cursorPosition.column] = newChar;
            }

            // Foreach "merges" consecutive undefined.
            for (var i = 0, l = rowWithCursor.length; i != l; i++) {
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

            var children = consecutive.map((group, groupIndex) => {
                return React.createElement(
                    'span',
                    _.merge(this.getHTMLAttributes(group.attributes), {key: `group-${groupIndex}`}),
                    group.text
                );
            });

            return React.createElement('div', {className: 'row', key: `row-${index}`}, null, ...children);
        }, (row: Array<Char>, index: number, cursorPosition: i.Position) => {
            if (cursorPosition.row == index) {
                return [
                    row,
                    index,
                    cursorPosition.row,
                    cursorPosition.column,
                    this.cursor.getBlink(),
                    this.cursor.getShow()
                ];
            } else {
                return [row, index];
            }
        })

    }

    writeString(string: string, attributes = this.attributes): void {
        for (var i = 0; i != string.length; ++i) {
            this.write(string.charAt(i), attributes);
        }
    }

    setTo(string: string, attributes = this.attributes): void {
        this.clear();
        this.writeString(string, attributes)
    }

    write(raw: string, attributes = this.attributes): void {
        var char = new Char(raw, _.clone(attributes));

        if (char.isSpecial()) {
            switch (char.getCharCode()) {
                case e.CharCode.NewLine:
                    this.cursor.moveRelative({vertical: 1}).moveAbsolute({horizontal: 0});
                    break;
                case e.CharCode.CarriageReturn:
                    this.cursor.moveAbsolute({horizontal: 0});
                    break;
                default:
                    console.error(`Couldn't write a special char ${char}`);
            }
        } else {
            this.set(this.cursor.getPosition(), char);
            this.cursor.next();
        }

        this.emit('data');
    }

    setAttributes(attributes: i.Attributes): void {
        this.attributes = _.merge(this.attributes, attributes);
    }

    toString(): string {
        return this.toLines().join('\n');
    }

    toLines(): string[] {
        return this.storage.map((row) => {
            return row.map((char) => {
                return char.toString();
            }).join('')
        });
    }

    map<R>(callback: (row: Array<Char>, index: number) => R): R[] {
        return this.storage.map(callback);
    }

    showCursor(state: boolean): void {
        this.cursor.setShow(state);
    }

    blinkCursor(state: boolean): void {
        this.cursor.setBlink(state);
    }

    moveCursorAbsolute(position: i.Advancement) {
        this.cursor.moveAbsolute(position);
        this.emit('data'); // Otherwise the view won't re-render on space in vim.
    }

    clearRow() {
        var cursorPosition = this.cursor.getPosition();
        this.storage[cursorPosition.row] = null;
    }

    clearRowToEnd() {
        var cursorPosition = this.cursor.getPosition();
        this.storage[cursorPosition.row].splice(cursorPosition.column, Number.MAX_VALUE);
    }

    clearRowToBeginning() {
        var cursorPosition = this.cursor.getPosition();
        this.storage[cursorPosition.row].splice(0, cursorPosition.column - 1);
    }

    clear() {
        this.storage = [];
        this.cursor.moveAbsolute({horizontal: 0, vertical: 0});
    }

    clearToBeginning() {
        var cursorPosition = this.cursor.getPosition();
        this.clearRowToBeginning();
        this.storage.splice(0, cursorPosition.row - 1);
    }

    clearToEnd() {
        var cursorPosition = this.cursor.getPosition();
        this.clearRowToEnd();
        this.storage.splice(cursorPosition.row + 1, Number.MAX_VALUE);
    }

    isEmpty(): boolean {
        return this.storage.length === 0;
    }

    render() {
        return React.createElement('pre', {className: 'output'}, null,
            ...this.storage.map((row: Char[], index: number) => {
                return this.renderRow(row, index, this.cursor.getPosition());
            })
        );
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

        this.storage[position.row][position.column] = char;
    }

    private addRow(row: number): void {
        this.storage[row] = []
    }

    private hasRow(row: number): boolean {
        return typeof this.storage[row] == 'object';
    }
}

export = Buffer;
