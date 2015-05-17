var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var events = require('events');
var Char = require('./Char');
var Cursor = require('./Cursor');
var React = require('react');
var e = require('./Enums');
var _ = require('lodash');
var Buffer = (function (_super) {
    __extends(Buffer, _super);
    function Buffer() {
        _super.call(this);
        this.storage = [];
        this.cursor = new Cursor();
        this.attributes = { color: e.Color.White, weight: e.Weight.Normal };
    }
    Buffer.prototype.writeString = function (string, attributes) {
        if (attributes === void 0) { attributes = this.attributes; }
        for (var i = 0; i != string.length; ++i) {
            this.write(string.charAt(i), attributes);
        }
    };
    Buffer.prototype.setTo = function (string, attributes) {
        if (attributes === void 0) { attributes = this.attributes; }
        this.clear();
        this.writeString(string, attributes);
    };
    Buffer.prototype.write = function (raw, attributes) {
        if (attributes === void 0) { attributes = this.attributes; }
        var char = new Char(raw, _.clone(attributes));
        if (char.isSpecial()) {
            switch (char.getCharCode()) {
                case e.CharCode.NewLine:
                    this.cursor.moveRelative({ vertical: 1 }).moveAbsolute({ horizontal: 0 });
                    break;
                case e.CharCode.CarriageReturn:
                    this.cursor.moveAbsolute({ horizontal: 0 });
                    break;
                default:
                    console.error("Couldn't write a special char " + char);
            }
        }
        else {
            this.set(this.cursor.getPosition(), char);
            this.cursor.next();
        }
        this.emit('data');
    };
    Buffer.prototype.setAttributes = function (attributes) {
        this.attributes = _.merge(this.attributes, attributes);
    };
    Buffer.prototype.toString = function () {
        return this.toLines().join('\n');
    };
    Buffer.prototype.toLines = function () {
        return this.storage.map(function (row) {
            return row.map(function (char) {
                return char.toString();
            }).join('');
        });
    };
    Buffer.prototype.map = function (callback) {
        return this.storage.map(callback);
    };
    Buffer.prototype.render = function () {
        return React.createElement.apply(React, ['pre', { className: 'output' }, null].concat(this.storage.map(this.renderRow, this)));
    };
    Buffer.prototype.clear = function () {
        this.storage = [];
    };
    Buffer.prototype.isEmpty = function () {
        return this.storage.length === 0;
    };
    Buffer.prototype.renderRow = function (row, index) {
        var _this = this;
        var consecutive = [];
        var current = { attributes: null, text: '' };
        row.forEach(function (element) {
            var attributes = element.getAttributes();
            var value = element.toString();
            if (_.isEqual(attributes, current.attributes)) {
                current.text += value;
                current.attributes = attributes;
            }
            else {
                consecutive.push(current);
                current = { attributes: attributes, text: value };
            }
        });
        consecutive.push(current);
        var children = consecutive.map(function (group, groupIndex) {
            return React.createElement('span', _.merge(_this.getHTMLAttributes(group.attributes), { key: "group-" + groupIndex }), group.text);
        });
        return React.createElement.apply(React, ['div', { className: 'row', key: "row-" + index }, null].concat(children));
    };
    Buffer.prototype.getHTMLAttributes = function (attributes) {
        var htmlAttributes = {};
        _.each(attributes, function (value, key) {
            htmlAttributes[("data-" + key)] = value;
        });
        return htmlAttributes;
    };
    Buffer.prototype.set = function (position, char) {
        if (!this.hasRow(position.row)) {
            this.addRow(position.row);
        }
        this.storage[position.row][position.column] = char;
    };
    Buffer.prototype.addRow = function (row) {
        this.storage[row] = [];
    };
    Buffer.prototype.hasRow = function (row) {
        return typeof this.storage[row] == 'object';
    };
    return Buffer;
})(events.EventEmitter);
module.exports = Buffer;
