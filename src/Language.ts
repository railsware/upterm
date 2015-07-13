var jison = require("jison");
import i = require('./Interfaces');
import _ = require('lodash');

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
    | 'ls'  LS_OPTION EOF
    | 'bundle' 'exec' COMMAND
    | 'which' COMMAND
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

class Language {
    parser: any;

    constructor() {
        this.parser = new jison.Parser(grammar);
    }

    parse(input: string): void {
        this.parser.parse(input);
    }

    lex(input: string): string[] {
        var lexer = this.parser.lexer;
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

    set onParsingError(handler: Function) {
        this.parser.yy.parseError = handler;
    }
}

export = Language

