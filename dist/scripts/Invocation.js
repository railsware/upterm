/// <reference path="References.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var _ = require('lodash');
var events = require('events');
var Parser_1 = require('./Parser');
var Prompt_1 = require('./Prompt');
var Buffer_1 = require('./Buffer');
var History_1 = require('./History');
var e = require('./Enums');
var List_1 = require('./decorators/List');
var CommandExecutor_1 = require("./CommandExecutor");
var Invocation = (function (_super) {
    __extends(Invocation, _super);
    function Invocation(directory, dimensions, history) {
        var _this = this;
        if (history === void 0) { history = new History_1.default(); }
        _super.call(this);
        this.directory = directory;
        this.dimensions = dimensions;
        this.history = history;
        this.status = e.Status.NotStarted;
        this.prompt = new Prompt_1.default(directory);
        this.prompt.on('send', function () { return _this.execute(); });
        this.buffer = new Buffer_1.default(dimensions);
        this.buffer.on('data', _.throttle(function () { return _this.emit('data'); }, 1000 / 60));
        this.parser = new Parser_1.default(this);
        this.id = "invocation-" + new Date().getTime();
    }
    Invocation.prototype.execute = function () {
        var _this = this;
        this.setStatus(e.Status.InProgress);
        CommandExecutor_1.default.execute(this).then(function () {
            _this.setStatus(e.Status.Success);
            _this.emit('end');
        }, function (errorMessage) {
            _this.setStatus(e.Status.Failure);
            if (errorMessage) {
                _this.buffer.writeString(errorMessage, { color: e.Color.Red });
            }
            _this.emit('end');
        });
    };
    Invocation.prototype.setPromptText = function (value) {
        this.prompt.getBuffer().setTo(value);
    };
    Invocation.prototype.write = function (input) {
        if (typeof input === 'string') {
            var text = input;
        }
        else {
            var event = input;
            var identifier = event.nativeEvent.keyIdentifier;
            if (identifier.startsWith('U+')) {
                var code = parseInt(identifier.substring(2), 16);
                if (code === e.CharCode.Backspace) {
                    code = e.CharCode.Delete;
                }
                text = String.fromCharCode(code);
                if (!event.shiftKey && code >= 65 && code <= 90) {
                    text = text.toLowerCase();
                }
            }
            else {
                text = String.fromCharCode(event.keyCode);
            }
        }
        this.command.stdin.write(text);
    };
    Invocation.prototype.hasOutput = function () {
        return !this.buffer.isEmpty();
    };
    Invocation.prototype.getDimensions = function () {
        return this.dimensions;
    };
    Invocation.prototype.setDimensions = function (dimensions) {
        this.dimensions = dimensions;
        if (this.command && this.status === e.Status.InProgress) {
            this.buffer.setDimensions(dimensions);
            this.command.resize(dimensions.columns, dimensions.rows);
        }
    };
    Invocation.prototype.canBeDecorated = function () {
        for (var _i = 0; _i < List_1.list.length; _i++) {
            var Decorator = List_1.list[_i];
            var decorator = new Decorator(this);
            if (this.status === e.Status.InProgress && !decorator.shouldDecorateRunningPrograms()) {
                continue;
            }
            if (decorator.isApplicable()) {
                return true;
            }
        }
        return false;
    };
    Invocation.prototype.decorate = function () {
        for (var _i = 0; _i < List_1.list.length; _i++) {
            var Decorator = List_1.list[_i];
            var decorator = new Decorator(this);
            if (decorator.isApplicable()) {
                return decorator.decorate();
            }
        }
    };
    Invocation.prototype.getBuffer = function () {
        return this.buffer;
    };
    Invocation.prototype.getPrompt = function () {
        return this.prompt;
    };
    Invocation.prototype.setStatus = function (status) {
        this.status = status;
        this.emit('status', status);
    };
    return Invocation;
})(events.EventEmitter);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Invocation;
