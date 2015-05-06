import _ = require('lodash');
import Base = require('Base');
import React = require('react');

class GitDiff extends Base {
    decorate(): any {
        var rows = this.invocation.getBuffer().toLines().map((row: string) => {
            if (/^\s*\+/.test(row)) {
                return React.createElement('div', {className: 'git-diff-new'}, null, row.replace(/^\++/, ''));
            } else if (/^\s*-/.test(row)) {
                return React.createElement('div', {className: 'git-diff-old'}, null, row.replace(/^-+/, ''));
            }
            return React.createElement('div', {}, null, row);
        });

        return React.createElement('pre', {className: 'output'}, rows, null);
    }

    isApplicable(): boolean {
        return _.isEqual(this.invocation.getPrompt().getCommand(), ['git', 'diff']);
    }
}

export = GitDiff;
