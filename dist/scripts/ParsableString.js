var Language_1 = require('./Language');
var Aliases_1 = require("./Aliases");
var ParsableString = (function () {
    function ParsableString(text) {
        this.text = text;
    }
    ParsableString.prototype.getLexemes = function (text) {
        if (text === void 0) { text = this.getText(); }
        return ParsableString.language.lex(text);
    };
    ParsableString.prototype.getText = function () {
        return this.text;
    };
    ParsableString.prototype.getLastLexeme = function () {
        return this.getLexemes().slice(-1)[0] || '';
    };
    ParsableString.prototype.parse = function () {
        ParsableString.language.parse(this.expand());
    };
    ParsableString.prototype.expand = function () {
        return this.expandToArray().join(' ');
    };
    ParsableString.prototype.expandToArray = function (text) {
        if (text === void 0) { text = this.getText(); }
        var args = this.getLexemes(text);
        var commandName = args.shift();
        var alias = Aliases_1.default.find(commandName);
        if (alias) {
            var aliasArgs = this.getLexemes(alias);
            var isRecursive = aliasArgs[0] === commandName;
            if (isRecursive) {
                return aliasArgs.concat(args);
            }
            else {
                return this.expandToArray(alias).concat(args);
            }
        }
        else {
            return [commandName].concat(args);
        }
    };
    Object.defineProperty(ParsableString.prototype, "onParsingError", {
        set: function (handler) {
            ParsableString.language.onParsingError = handler;
        },
        enumerable: true,
        configurable: true
    });
    ParsableString.language = new Language_1.default();
    return ParsableString;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ParsableString;
