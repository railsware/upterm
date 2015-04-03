var $ = require('jquery');
var lodash = require('lodash');
var Shell = require('./shell');

function Terminal(document) {
    this.shell = new Shell();
    this.document = document;

    this.shell.on('data', this.print.bind(this)).on('end', this.createPrompt.bind(this));

    this.createPrompt();
}

Terminal.prototype.createPrompt = function () {
    this.currentInput().removeClass('currentInput');
    this.currentOutput().removeClass('currentOutput');

    var newInput = this.document.createElement("input");
    newInput.type = "text";
    $(newInput).addClass('currentInput');
    this.document.getElementById('board').appendChild(newInput);
    newInput.focus();
    this.addKeysHandler();

    var container = this.document.createElement("pre");
    container.className += 'currentOutput';

    this.document.getElementById('board').appendChild(container);
};

Terminal.prototype.addKeysHandler = function () {
    this.currentInput().keydown(function (e) {
        if (e.which === 13) {
            this.shell.execute(this.currentInput().val());

            return false;
        }

        // Ctrl+P, ↑.
        if ((e.ctrlKey && e.keyCode === 80) || e.keyCode === 38) {
            this.currentInput().val(this.shell.history.previous());

            return false;
        }

        // Ctrl+N, ↓.
        if ((e.ctrlKey && e.keyCode === 78) || e.keyCode === 40) {
            this.currentInput().val(this.shell.history.next());

            return false;
        }
    }.bind(this));
};

Terminal.prototype.print = function (data) {
    var output = this.currentOutput()[0];

    lodash.map(data, function (char) {
        if (char.charCodeAt(0) === 27) {
            output.innerHTML += '\\E';
        } else {
            output.innerHTML += char;
        }
    });
};

Terminal.prototype.currentInput = function () {
    return $('.currentInput');
};

Terminal.prototype.currentOutput = function () {
    return $('.currentOutput');
};

module.exports = Terminal;
