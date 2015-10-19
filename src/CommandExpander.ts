var jison = require("jison");
import * as i from './Interfaces';
import * as _ from 'lodash';
import Aliases from "./Aliases";
import History from "./History";

var grammar = `
%lex
%%
\\s+    {/* skip whitespace */}
[^\\s]+    {return yytext;}
<<EOF>> {return 'EOF';}

/lex

%start COMMAND

%%

COMMAND
    : 'git' GIT_OPTION EOF
    | 'hub' GIT_OPTION EOF
    | LS LS_OPTION EOF
    | 'bundle' 'exec' COMMAND
    | 'which' COMMAND
    ;

LS
    : 'ls'
    | 'exa'
    ;

GIT_OPTION
    : 'add'
    | 'commit-tree'
    | 'fsck'
    | 'merge-index'
    | 'receive-pack'
    | 'show-branch'
    | 'add--interactive'
    | 'config'
    | 'fsck-objects'
    | 'merge-octopus'
    | 'reflog'
    | 'show-index'
    | 'am'
    | 'count-objects'
    | 'gc'
    | 'merge-one-file'
    | 'relink'
    | 'show-ref'
    | 'annotate'
    | 'credential'
    | 'get-tar-commit-id'
    | 'merge-ours'
    | 'remote'
    | 'stage'
    | 'apply'
    | 'credential-cache'
    | 'grep'
    | 'merge-recursive'
    | 'remote-ext'
    | 'stash'
    | 'archimport'
    | 'credential-cache--daemon'
    | 'gui'
    | 'merge-resolve'
    | 'remote-fd'
    | 'status'
    | 'archive'
    | 'credential-store'
    | 'gui--askpass'
    | 'merge-subtree'
    | 'remote-ftp'
    | 'stripspace'
    | 'bisect'
    | 'cvsexportcommit'
    | 'hash-object'
    | 'merge-tree'
    | 'remote-ftps'
    | 'submodule'
    | 'bisect--helper'
    | 'cvsimport'
    | 'help'
    | 'mergetool'
    | 'remote-http'
    | 'svn'
    | 'blame'
    | 'cvsserver'
    | 'http-backend'
    | 'mktag'
    | 'remote-https'
    | 'symbolic-ref'
    | 'branch'
    | 'daemon'
    | 'http-fetch'
    | 'mktree'
    | 'remote-testsvn'
    | 'tag'
    | 'bundle'
    | 'describe'
    | 'http-push'
    | 'mv'
    | 'repack'
    | 'unpack-file'
    | 'cat-file'
    | 'diff'
    | 'index-pack'
    | 'name-rev'
    | 'replace'
    | 'unpack-objects'
    | 'check-attr'
    | 'diff-files'
    | 'init'
    | 'notes'
    | 'request-pull'
    | 'update-index'
    | 'check-ignore'
    | 'diff-index'
    | 'init-db'
    | 'p4'
    | 'rerere'
    | 'update-ref'
    | 'check-mailmap'
    | 'diff-tree'
    | 'instaweb'
    | 'pack-objects'
    | 'reset'
    | 'update-server-info'
    | 'check-ref-format'
    | 'difftool'
    | 'interpret-trailers'
    | 'pack-redundant'
    | 'rev-list'
    | 'upload-archive'
    | 'checkout'
    | 'difftool--helper'
    | 'log'
    | 'pack-refs'
    | 'rev-parse'
    | 'upload-pack'
    | 'checkout-index'
    | 'fast-export'
    | 'ls-files'
    | 'patch-id'
    | 'revert'
    | 'var'
    | 'cherry'
    | 'fast-import'
    | 'ls-remote'
    | 'prune'
    | 'rm'
    | 'verify-commit'
    | 'cherry-pick'
    | 'fetch'
    | 'ls-tree'
    | 'prune-packed'
    | 'send-email'
    | 'verify-pack'
    | 'citool'
    | 'fetch-pack'
    | 'mailinfo'
    | 'pull'
    | 'send-pack'
    | 'verify-tag'
    | 'clean'
    | 'filter-branch'
    | 'mailsplit'
    | 'push'
    | 'sh-i18n--envsubst'
    | 'web--browse'
    | 'clone'
    | 'fmt-merge-msg'
    | 'merge'
    | 'quiltimport'
    | 'shell'
    | 'whatchanged'
    | 'column'
    | 'for-each-ref'
    | 'merge-base'
    | 'read-tree'
    | 'shortlog'
    | 'write-tree'
    | 'commit'
    | 'format-patch'
    | 'merge-file'
    | 'rebase'
    | 'show'
    | '--version'
    ;

LS_OPTION
    : '--help'
    ;
        `;

let parser = new jison.Parser(grammar);
let lexer = parser.lexer;

function lex(input: string): string[] {
    lexer.setInput(input);

    var lexemes: string[] = [];
    var lexeme = lexer.lex();

    while(typeof lexeme === 'string') {
        lexemes.push(lexeme);
        lexeme = lexer.lex();
    }

    if (input.endsWith(' ')) {
        lexemes.push('');
    }

    return lexemes;
}

function expandAliases(args: string[]): string[] {
    const commandName = args.shift();
    const alias: string = Aliases.find(commandName);

    if (alias) {
        const aliasArgs = lex(alias);
        const isRecursive = aliasArgs[0] === commandName;

        if (isRecursive) {
            return aliasArgs.concat(args);
        } else {
            return expandAliases(lex(alias)).concat(args);
        }
    } else {
        return [commandName, ...args];
    }
}

function expandHistory(text: string): string[] {
    return lex(lex(text).map(lexeme => historyReplacement(lexeme)).join(' '));
}

export const historyCommands: _.Dictionary<string> = {
    'The previous command': '!!',
    'The first argument of the previous command': '!^',
    'The last argument of the previous command': '!$',
    'All arguments of the previous command': '!*',
};

export function isCompleteHistoryCommand(lexeme) {
    return lexeme[0] === '!' && lexeme.length > 1;
}

// FIXME: figure out why this function is called three times for a command with three letters.
// FIXME: add recursive replacement, so that two !! in a row would work.
export function historyReplacement(lexeme: string): string {
    if (!isCompleteHistoryCommand(lexeme)) {
        return lexeme;
    }

    const matcher = lexeme.substring(1);

    const position = parseInt(matcher);
    if (!isNaN(position)) {
        return History.at(position).raw;
    }

    const lastCommand = History.last;
    switch (lexeme) {
        case historyCommands['The previous command']:
            return lastCommand.expanded.join(' ');
        case historyCommands['The first argument of the previous command']:
            return lastCommand.expanded[1];
        case historyCommands['The last argument of the previous command']:
            return _.last(lastCommand.expanded);
        case historyCommands['All arguments of the previous command']:
            return lastCommand.expanded.slice(1).join(' ');
    }

    return History.lastWithPrefix(matcher);
}


export default class CommandExpander {
    private text: string;
    private _lexemes: string[];

    constructor(text: string) {
        this.text = text;
        this._lexemes = lex(text);
    }

    get lexemes(): string[] {
        return this._lexemes;
    }

    getText(): string {
        return this.text;
    }

    get lastLexeme(): string {
        return this.lexemes.slice(-1)[0] || '';
    }

    parse(): void {
        parser.parse(this.expand().join(' '));
    }

    expand(): string[] {
        return expandAliases(expandHistory(this.getText()));
    }

    set onParsingError(handler: Function) {
        parser.yy.parseError = handler;
    }
}
