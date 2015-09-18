var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var JSONTree = require('../JSONTree');
var Base_1 = require('./Base');
var React = require('react');
var Json = (function (_super) {
    __extends(Json, _super);
    function Json() {
        _super.apply(this, arguments);
    }
    Json.prototype.decorate = function () {
        return React.createElement(JSONTree, { data: JSON.parse(this.stringifiedOutputBuffer()) });
    };
    Json.prototype.isApplicable = function () {
        try {
            JSON.parse(this.stringifiedOutputBuffer());
            return true;
        }
        catch (exception) {
            return false;
        }
    };
    Json.prototype.stringifiedOutputBuffer = function () {
        return this.invocation.getBuffer().toString();
    };
    return Json;
})(Base_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Json;
