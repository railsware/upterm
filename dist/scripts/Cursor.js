var Cursor = (function () {
    function Cursor(position) {
        if (position === void 0) { position = { row: 0, column: 0 }; }
        this.position = position;
        this.show = false;
        this.blink = false;
    }
    Cursor.prototype.moveAbsolute = function (advancement) {
        if (typeof advancement.horizontal !== 'undefined') {
            this.position.column = advancement.horizontal;
        }
        if (typeof advancement.vertical !== 'undefined') {
            this.position.row = advancement.vertical;
        }
        return this;
    };
    Cursor.prototype.moveRelative = function (advancement, dimensions) {
        var vertical = Math.max(0, this.row() + (advancement.vertical || 0));
        var horizontal = Math.max(0, this.column() + (advancement.horizontal || 0));
        if (dimensions) {
            vertical = Math.min(dimensions.rows - 1, vertical);
            horizontal = Math.min(dimensions.columns - 1, horizontal);
        }
        this.moveAbsolute({ vertical: vertical, horizontal: horizontal });
        return this;
    };
    Cursor.prototype.next = function () {
        this.moveRelative({ horizontal: 1 });
    };
    Cursor.prototype.getPosition = function () {
        return this.position;
    };
    Cursor.prototype.column = function () {
        return this.position.column;
    };
    Cursor.prototype.row = function () {
        return this.position.row;
    };
    Cursor.prototype.getShow = function () {
        return this.show;
    };
    Cursor.prototype.getBlink = function () {
        return this.blink;
    };
    Cursor.prototype.setShow = function (state) {
        this.show = state;
    };
    Cursor.prototype.setBlink = function (state) {
        this.blink = state;
    };
    return Cursor;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Cursor;
