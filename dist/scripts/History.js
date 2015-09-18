var History = (function () {
    function History() {
    }
    History.append = function (command) {
        var duplicateIndex = this.stack.indexOf(command);
        if (duplicateIndex !== -1) {
            this.stack.splice(duplicateIndex, 1);
        }
        this.stack.push(command);
        if (this.size() > this.historySize) {
            this.stack.splice(0, this.stack.length - this.historySize);
        }
        this.pointer = this.stack.length;
    };
    History.getPrevious = function () {
        if (this.pointer > 0) {
            this.pointer -= 1;
        }
        return this.stack[this.pointer];
    };
    History.getNext = function () {
        if (this.pointer < this.stack.length) {
            this.pointer += 1;
        }
        return this.stack[this.pointer];
    };
    History.size = function () {
        return this.stack.length;
    };
    History.clear = function () {
        this.stack = [];
    };
    History.prototype.serialize = function () {
        return "History:" + JSON.stringify(History.stack);
    };
    History.deserialize = function (serialized) {
        var _this = this;
        var stack = JSON.parse(serialized);
        stack.forEach(function (item) { return _this.append(item); });
    };
    History.historySize = 1000;
    History.pointer = 0;
    History.stack = [];
    return History;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = History;
