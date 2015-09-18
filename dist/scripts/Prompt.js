var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var events = require('events');
var Autocompletion_1 = require('./Autocompletion');
var Buffer_1 = require('./Buffer');
var History_1 = require('./History');
var ParsableString_1 = require('./ParsableString');
var Prompt = (function (_super) {
    __extends(Prompt, _super);
    function Prompt(directory) {
        var _this = this;
        _super.call(this);
        this.directory = directory;
        this.autocompletion = new Autocompletion_1.default();
        this.buffer = new Buffer_1.default({ columns: 99999, rows: 99999 });
        this.buffer.on('data', function () { _this.commandParts = _this.toParsableString().expandToArray(); });
        this.history = History_1.default;
    }
    Prompt.prototype.execute = function () {
        this.history.append(this.buffer.toString());
        this.emit('send');
    };
    Prompt.prototype.getCommandName = function () {
        return this.getWholeCommand()[0];
    };
    Prompt.prototype.getArguments = function () {
        return this.getWholeCommand().slice(1);
    };
    Prompt.prototype.getLastArgument = function () {
        return this.getWholeCommand().slice(-1)[0] || '';
    };
    Prompt.prototype.getWholeCommand = function () {
        return this.commandParts;
    };
    Prompt.prototype.getSuggestions = function () {
        return this.autocompletion.getSuggestions(this);
    };
    Prompt.prototype.getCWD = function () {
        return this.directory;
    };
    Prompt.prototype.getBuffer = function () {
        return this.buffer;
    };
    Prompt.prototype.replaceCurrentLexeme = function (suggestion) {
        var lexemes = this.toParsableString().getLexemes();
        lexemes[lexemes.length - 1] = "" + (suggestion.prefix || "") + suggestion.value;
        this.buffer.setTo(lexemes.join(' '));
    };
    Prompt.prototype.toParsableString = function () {
        return new ParsableString_1.default(this.buffer.toString());
    };
    return Prompt;
})(events.EventEmitter);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Prompt;
