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
    this.pointer = this.stack.length - 1;
};

History.prototype.previous = function () {
    var previousCommand = this.stack[this.pointer];
    this.pointer -= 1;

    return previousCommand;
};

module.exports = History;
