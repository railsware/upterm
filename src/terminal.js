var $ = require('jquery');
var lodash = require('lodash');
var Shell = require('./shell');

function Terminal(document) {
    this.shell = new Shell();
    this.document = document;
    this.output = '';

    this.shell.on('data', this.processANSI.bind(this)).on('end', this.createPrompt.bind(this));

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
            this.output = '';
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

var terminal = {
    inst_p: function (s) {
        console.log('print', s);
    },
    inst_o: function (s) {
        console.log('osc', s);
    },
    inst_x: function (flag) {
        console.log('execute', flag.charCodeAt(0));
    },
    inst_c: function (collected, params, flag) {
        console.log('csi', collected, params, flag);
    },
    inst_e: function (collected, flag) {
        console.log('esc', collected, flag);
    }
};
var AnsiParser = require('node-ansiparser');
var parser = new AnsiParser(terminal);


Terminal.prototype.processANSI = function (data) {
    this.output += data;
    var output = this.currentOutput()[0];

    parser.parse(data);

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

Terminal.prototype.resize = function (dimensions) {
    this.shell.resize(dimensions);
};

module.exports = Terminal;
