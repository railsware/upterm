var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var events = require('events');
var Char_1 = require('./Char');
var Cursor_1 = require('./Cursor');
var React = require('react');
var e = require('./Enums');
var _ = require('lodash');
var Utils_1 = require('./Utils');
var Decorators_1 = require("./Decorators");
var Buffer = (function (_super) {
    __extends(Buffer, _super);
    function Buffer(dimensions) {
        _super.call(this);
        this.dimensions = dimensions;
        this.storage = [];
        this.cursor = new Cursor_1.default();
        this.activeBuffer = 'standard';
        this.attributes = { color: e.Color.White, weight: e.Weight.Normal };
    }
    Buffer.prototype.renderRow = function (row, index, cursor) {
        var _this = this;
        var consecutive = [];
        var current = { attributes: null, text: '' };
        var cursorPosition = cursor.getPosition();
        if (process.platform === 'win32' && row.length < 1)
            return;
        if (index == cursorPosition.row && this.cursor.getShow()) {
            var rowWithCursor = [];
            for (var i = 0; i !== row.length; ++i) {
                var old = row[i];
                if (old) {
                    rowWithCursor[i] = Char_1.default.flyweight(old.toString(), old.getAttributes());
                }
            }
            var cursorAttributes = { 'background-color': e.Color.White, color: e.Color.Black };
            if (rowWithCursor[cursorPosition.column]) {
                var char = rowWithCursor[cursorPosition.column];
                var newChar = Char_1.default.flyweight(char.toString(), _.merge(char.getAttributes(), cursorAttributes));
            }
            else {
                newChar = Char_1.default.flyweight(' ', cursorAttributes);
            }
            rowWithCursor[cursorPosition.column] = newChar;
        }
        else {
            rowWithCursor = row;
        }
        for (var i = 0, l = rowWithCursor.length; i !== l; i++) {
            var element = rowWithCursor[i];
            if (element) {
                var attributes = element.getAttributes();
                var value = element.toString();
            }
            else {
                attributes = {};
                value = ' ';
            }
            if (_.isEqual(attributes, current.attributes)) {
                current.text += value;
                current.attributes = attributes;
            }
            else {
                consecutive.push(current);
                current = { attributes: attributes, text: value };
            }
        }
        consecutive.push(current);
        var children = consecutive.map(function (group, groupIndex) {
            return React.createElement('span', _.merge(_this.getHTMLAttributes(group.attributes), { key: "group-" + groupIndex }), group.text);
        });
        return React.createElement.apply(React, ['div', { className: 'row', key: "row-" + index }, null].concat(children));
    };
    Buffer.prototype.writeString = function (string, attributes) {
        if (attributes === void 0) { attributes = this.attributes; }
        for (var i = 0; i !== string.length; ++i) {
            this.write(string.charAt(i), attributes);
        }
    };
    Buffer.prototype.setTo = function (string, attributes) {
        if (attributes === void 0) { attributes = this.attributes; }
        this.clear();
        this.writeString(string, attributes);
    };
    Buffer.prototype.write = function (char, attributes) {
        if (attributes === void 0) { attributes = this.attributes; }
        var charObject = Char_1.default.flyweight(char, this.getAttributes());
        if (charObject.isSpecial()) {
            switch (charObject.getCharCode()) {
                case e.CharCode.Bell:
                    if (window['DEBUG']) {
                        var audio = new Audio("data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4Tvh9Rz/y8QADBwMWgQAZG/ILNAARQ4GLTcDeIIIhxGOBAuD7hOfBB3/94gcJ3w+o5/5eIAIAAAVwWgQAVQ2ORaIQwEMAJiDg95G4nQL7mQVWI6GwRcfsZAcsKkJvxgxEjzFUgfHoSQ9Qq7KNwqHwuB13MA4a1q/DmBrHgPcmjiGoh//EwC5nGPEmS4RcfkVKOhJf+WOgoxJclFz3kgn//dBA+ya1GhurNn8zb//9NNutNuhz31f////9vt///z+IdAEAAAK4LQIAKobHItEIYCGAExBwe8jcToF9zIKrEdDYIuP2MgOWFSE34wYiR5iqQPj0JIeoVdlG4VD4XA67mAcNa1fhzA1jwHuTRxDUQ//iYBczjHiTJcIuPyKlHQkv/LHQUYkuSi57yQT//uggfZNajQ3Vmz+Zt//+mm3Wm3Q576v////+32///5/EOgAAADVghQAAAAA//uQZAUAB1WI0PZugAAAAAoQwAAAEk3nRd2qAAAAACiDgAAAAAAABCqEEQRLCgwpBGMlJkIz8jKhGvj4k6jzRnqasNKIeoh5gI7BJaC1A1AoNBjJgbyApVS4IDlZgDU5WUAxEKDNmmALHzZp0Fkz1FMTmGFl1FMEyodIavcCAUHDWrKAIA4aa2oCgILEBupZgHvAhEBcZ6joQBxS76AgccrFlczBvKLC0QI2cBoCFvfTDAo7eoOQInqDPBtvrDEZBNYN5xwNwxQRfw8ZQ5wQVLvO8OYU+mHvFLlDh05Mdg7BT6YrRPpCBznMB2r//xKJjyyOh+cImr2/4doscwD6neZjuZR4AgAABYAAAABy1xcdQtxYBYYZdifkUDgzzXaXn98Z0oi9ILU5mBjFANmRwlVJ3/6jYDAmxaiDG3/6xjQQCCKkRb/6kg/wW+kSJ5//rLobkLSiKmqP/0ikJuDaSaSf/6JiLYLEYnW/+kXg1WRVJL/9EmQ1YZIsv/6Qzwy5qk7/+tEU0nkls3/zIUMPKNX/6yZLf+kFgAfgGyLFAUwY//uQZAUABcd5UiNPVXAAAApAAAAAE0VZQKw9ISAAACgAAAAAVQIygIElVrFkBS+Jhi+EAuu+lKAkYUEIsmEAEoMeDmCETMvfSHTGkF5RWH7kz/ESHWPAq/kcCRhqBtMdokPdM7vil7RG98A2sc7zO6ZvTdM7pmOUAZTnJW+NXxqmd41dqJ6mLTXxrPpnV8avaIf5SvL7pndPvPpndJR9Kuu8fePvuiuhorgWjp7Mf/PRjxcFCPDkW31srioCExivv9lcwKEaHsf/7ow2Fl1T/9RkXgEhYElAoCLFtMArxwivDJJ+bR1HTKJdlEoTELCIqgEwVGSQ+hIm0NbK8WXcTEI0UPoa2NbG4y2K00JEWbZavJXkYaqo9CRHS55FcZTjKEk3NKoCYUnSQ0rWxrZbFKbKIhOKPZe1cJKzZSaQrIyULHDZmV5K4xySsDRKWOruanGtjLJXFEmwaIbDLX0hIPBUQPVFVkQkDoUNfSoDgQGKPekoxeGzA4DUvnn4bxzcZrtJyipKfPNy5w+9lnXwgqsiyHNeSVpemw4bWb9psYeq//uQZBoABQt4yMVxYAIAAAkQoAAAHvYpL5m6AAgAACXDAAAAD59jblTirQe9upFsmZbpMudy7Lz1X1DYsxOOSWpfPqNX2WqktK0DMvuGwlbNj44TleLPQ+Gsfb+GOWOKJoIrWb3cIMeeON6lz2umTqMXV8Mj30yWPpjoSa9ujK8SyeJP5y5mOW1D6hvLepeveEAEDo0mgCRClOEgANv3B9a6fikgUSu/DmAMATrGx7nng5p5iimPNZsfQLYB2sDLIkzRKZOHGAaUyDcpFBSLG9MCQALgAIgQs2YunOszLSAyQYPVC2YdGGeHD2dTdJk1pAHGAWDjnkcLKFymS3RQZTInzySoBwMG0QueC3gMsCEYxUqlrcxK6k1LQQcsmyYeQPdC2YfuGPASCBkcVMQQqpVJshui1tkXQJQV0OXGAZMXSOEEBRirXbVRQW7ugq7IM7rPWSZyDlM3IuNEkxzCOJ0ny2ThNkyRai1b6ev//3dzNGzNb//4uAvHT5sURcZCFcuKLhOFs8mLAAEAt4UWAAIABAAAAAB4qbHo0tIjVkUU//uQZAwABfSFz3ZqQAAAAAngwAAAE1HjMp2qAAAAACZDgAAAD5UkTE1UgZEUExqYynN1qZvqIOREEFmBcJQkwdxiFtw0qEOkGYfRDifBui9MQg4QAHAqWtAWHoCxu1Yf4VfWLPIM2mHDFsbQEVGwyqQoQcwnfHeIkNt9YnkiaS1oizycqJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");
                        audio.play();
                    }
                    Utils_1.default.log('bell');
                    break;
                case e.CharCode.Backspace:
                    this.cursor.moveRelative({ horizontal: -1 });
                    break;
                case e.CharCode.NewLine:
                    this.cursor.moveRelative({ vertical: 1 }).moveAbsolute({ horizontal: 0 });
                    break;
                case e.CharCode.CarriageReturn:
                    this.cursor.moveAbsolute({ horizontal: 0 });
                    break;
                default:
                    Utils_1.default.error("Couldn't write a special char '" + charObject + "' with char code " + charObject.toString().charCodeAt(0) + ".");
            }
        }
        else {
            if (this.cursor.column() >= this.dimensions.columns) {
                this.cursor.moveRelative({ vertical: 1 }).moveAbsolute({ horizontal: 0 });
            }
            this.set(this.cursor.getPosition(), charObject);
            this.cursor.next();
        }
        this.emit('data');
    };
    Buffer.prototype.getAttributes = function () {
        return _.clone(this.attributes);
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
    Buffer.prototype.showCursor = function (state) {
        this.cursor.setShow(state);
        this.emit('data');
    };
    Buffer.prototype.blinkCursor = function (state) {
        this.cursor.setBlink(state);
        this.emit('data');
    };
    Buffer.prototype.moveCursorRelative = function (position) {
        this.cursor.moveRelative(position, this.dimensions);
        this.emit('data');
    };
    Buffer.prototype.moveCursorAbsolute = function (position) {
        this.cursor.moveAbsolute(position);
        this.emit('data');
    };
    Buffer.prototype.clearCurrent = function () {
        var cursorPosition = this.cursor.getPosition();
        this.storage[cursorPosition.row][cursorPosition.column] = null;
        this.emit('data');
    };
    Buffer.prototype.clearRow = function () {
        var cursorPosition = this.cursor.getPosition();
        this.storage[cursorPosition.row] = null;
        this.emit('data');
    };
    Buffer.prototype.clearRowToEnd = function () {
        var cursorPosition = this.cursor.getPosition();
        var row = this.storage[cursorPosition.row];
        if (row) {
            row.splice(cursorPosition.column, Number.MAX_VALUE);
        }
        this.emit('data');
    };
    Buffer.prototype.clearRowToBeginning = function () {
        var cursorPosition = this.cursor.getPosition();
        var row = this.storage[cursorPosition.row];
        if (row) {
            for (var i = 0; i <= cursorPosition.column; ++i) {
                row[i] = null;
            }
        }
        this.emit('data');
    };
    Buffer.prototype.clear = function () {
        this.storage = [];
        this.cursor.moveAbsolute({ horizontal: 0, vertical: 0 });
        this.emit('data');
    };
    Buffer.prototype.clearToBeginning = function () {
        var cursorPosition = this.cursor.getPosition();
        this.clearRowToBeginning();
        for (var i = 0; i !== cursorPosition.row; ++i) {
            this.storage[i] = [];
        }
        this.emit('data');
    };
    Buffer.prototype.clearToEnd = function () {
        var cursorPosition = this.cursor.getPosition();
        this.clearRowToEnd();
        this.storage.splice(cursorPosition.row + 1, Number.MAX_VALUE);
        this.emit('data');
    };
    Buffer.prototype.isEmpty = function () {
        return this.storage.length === 0;
    };
    Buffer.prototype.render = function () {
        var _this = this;
        return React.createElement.apply(React, ['pre', { className: "output " + this.activeBuffer }, null].concat(this.storage.map(function (row, index) {
            return _this.renderRow(row || [], index, _this.cursor);
        })));
    };
    Buffer.prototype.setDimensions = function (dimensions) {
        this.dimensions = dimensions;
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
    Buffer.prototype.hasRow = function (rowIndex) {
        var row = this.storage[rowIndex];
        return row && (typeof row === 'object');
    };
    Object.defineProperty(Buffer.prototype, "renderRow",
        __decorate([
            Decorators_1.memoize(function (row, index, cursor) {
                var key = [row, index];
                if (cursor.getPosition().row === index) {
                    key = key.concat([cursor.getPosition(), cursor.getBlink(), cursor.getShow()]);
                }
                return [JSON.stringify(key)];
            })
        ], Buffer.prototype, "renderRow", Object.getOwnPropertyDescriptor(Buffer.prototype, "renderRow")));
    return Buffer;
})(events.EventEmitter);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Buffer;
