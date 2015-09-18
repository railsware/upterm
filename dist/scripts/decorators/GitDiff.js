var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var _ = require('lodash');
var Base_1 = require('./Base');
var React = require('react');
var GitDiff = (function (_super) {
    __extends(GitDiff, _super);
    function GitDiff() {
        _super.apply(this, arguments);
    }
    GitDiff.prototype.decorate = function () {
        var rows = this.invocation.getBuffer().toLines().map(function (row) {
            if (/^\s*\+/.test(row)) {
                return React.createElement('div', { className: 'git-diff-new' }, null, row.replace(/^\++/, ''));
            }
            else if (/^\s*-/.test(row)) {
                return React.createElement('div', { className: 'git-diff-old' }, null, row.replace(/^-+/, ''));
            }
            return React.createElement('div', {}, null, row);
        });
        return React.createElement('pre', { className: 'output' }, rows, null);
    };
    GitDiff.prototype.isApplicable = function () {
        return this.invocation.hasOutput() && _.isEqual(this.invocation.getPrompt().getWholeCommand(), ['git', 'diff']);
    };
    return GitDiff;
})(Base_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GitDiff;
