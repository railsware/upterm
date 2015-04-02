function History() {
    this.stack = [];
    this.pointer = 0;
}

History.prototype.append = function (command) {
    var repeatedIndex = this.stack.indexOf(command);

    if (repeatedIndex !== -1) {
        this.stack.splice(repeatedIndex, 1);
    }

    this.stack.push(command);
    this.pointer = this.stack.length;
};

History.prototype.previous = function () {
    if (this.pointer > 0) {
        this.pointer -= 1;
    }

    return this.stack[this.pointer];
};

History.prototype.next = function () {
    if (this.pointer < this.stack.length) {
        this.pointer += 1;
    }

    return this.stack[this.pointer];
};

module.exports = History;
