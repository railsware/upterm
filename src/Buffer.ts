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

    constructor() {
        super();
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

    clear() {
        this.storage = [];
        this.cursor.moveAbsolute({horizontal: 0, vertical: 0});
    }

    isEmpty(): boolean {
        return this.storage.length === 0;
    }

    render() {
        return React.createElement('pre', {className: 'output'}, null, ...this.storage.map(this.renderRow, this));
    }

    private renderRow(row: Array<Char>, index: number) {

        var consecutive: Array<any> = [];
        var current = {attributes: <i.Attributes>null, text: ''};

        var rowWithCursor = row;
        var cursorPosition = this.cursor.getPosition();

        if (index == cursorPosition.row) {
            rowWithCursor = _.clone(row);
            if (rowWithCursor[cursorPosition.column]) {
                var char = rowWithCursor[cursorPosition.column];
                var newChar = new Char(char.toString(), _.merge(char.getAttributes(), this.attributes));
            } else {
                newChar = new Char(' ', this.attributes);
            }

            rowWithCursor[cursorPosition.column] = newChar;
        }

        rowWithCursor.forEach((element: Char, column: number) => {
            if (!element) return;

            var attributes = element.getAttributes();
            var value = element.toString();

            if (_.isEqual(attributes, current.attributes)) {
                current.text += value;
                current.attributes = attributes;
            } else {
                consecutive.push(current);
                current = {attributes: attributes, text: value};
            }
        });

        consecutive.push(current);

        var children = consecutive.map((group, groupIndex) => {
            return React.createElement(
                'span',
                _.merge(this.getHTMLAttributes(group.attributes), {key: `group-${groupIndex}`}),
                group.text
            );
        });

        return React.createElement('div', {className: 'row', key: `row-${index}`}, null, ...children);
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
