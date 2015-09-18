var Terminal_1 = require("./Terminal");
var Application = (function () {
    function Application(charSize, windowSize) {
        this._terminals = [];
        this._charSize = charSize;
        this.contentSize = windowSize;
        this.terminals.push(new Terminal_1.default(this.contentDimensions));
    }
    Object.defineProperty(Application.prototype, "terminals", {
        get: function () {
            return this._terminals;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Application.prototype, "contentSize", {
        get: function () {
            return this._contentSize;
        },
        set: function (newSize) {
            var _this = this;
            this._contentSize = newSize;
            this.terminals.forEach(function (terminal) { return terminal.setDimensions(_this.contentDimensions); });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Application.prototype, "charSize", {
        get: function () {
            return this._charSize;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Application.prototype, "contentDimensions", {
        get: function () {
            return {
                columns: Math.floor(this.contentSize.width / this.charSize.width),
                rows: Math.floor(this.contentSize.height / this.charSize.height),
            };
        },
        enumerable: true,
        configurable: true
    });
    return Application;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Application;
