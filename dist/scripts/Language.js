var jison = require("jison");
var grammar = "\n%lex\n%%\n\\s+    {/* skip whitespace */}\n[^\\s]+    {return yytext;}\n<<EOF>> {return 'EOF';}\n\n/lex\n\n%start COMMAND\n\n%%\n\nCOMMAND\n    : 'git' GIT_OPTION EOF\n    | 'hub' GIT_OPTION EOF\n    | 'ls'  LS_OPTION EOF\n    | 'bundle' 'exec' COMMAND\n    | 'which' COMMAND\n    ;\n\nGIT_OPTION\n    : 'add'\n    | 'commit-tree'\n    | 'fsck'\n    | 'merge-index'\n    | 'receive-pack'\n    | 'show-branch'\n    | 'add--interactive'\n    | 'config'\n    | 'fsck-objects'\n    | 'merge-octopus'\n    | 'reflog'\n    | 'show-index'\n    | 'am'\n    | 'count-objects'\n    | 'gc'\n    | 'merge-one-file'\n    | 'relink'\n    | 'show-ref'\n    | 'annotate'\n    | 'credential'\n    | 'get-tar-commit-id'\n    | 'merge-ours'\n    | 'remote'\n    | 'stage'\n    | 'apply'\n    | 'credential-cache'\n    | 'grep'\n    | 'merge-recursive'\n    | 'remote-ext'\n    | 'stash'\n    | 'archimport'\n    | 'credential-cache--daemon'\n    | 'gui'\n    | 'merge-resolve'\n    | 'remote-fd'\n    | 'status'\n    | 'archive'\n    | 'credential-store'\n    | 'gui--askpass'\n    | 'merge-subtree'\n    | 'remote-ftp'\n    | 'stripspace'\n    | 'bisect'\n    | 'cvsexportcommit'\n    | 'hash-object'\n    | 'merge-tree'\n    | 'remote-ftps'\n    | 'submodule'\n    | 'bisect--helper'\n    | 'cvsimport'\n    | 'help'\n    | 'mergetool'\n    | 'remote-http'\n    | 'svn'\n    | 'blame'\n    | 'cvsserver'\n    | 'http-backend'\n    | 'mktag'\n    | 'remote-https'\n    | 'symbolic-ref'\n    | 'branch'\n    | 'daemon'\n    | 'http-fetch'\n    | 'mktree'\n    | 'remote-testsvn'\n    | 'tag'\n    | 'bundle'\n    | 'describe'\n    | 'http-push'\n    | 'mv'\n    | 'repack'\n    | 'unpack-file'\n    | 'cat-file'\n    | 'diff'\n    | 'index-pack'\n    | 'name-rev'\n    | 'replace'\n    | 'unpack-objects'\n    | 'check-attr'\n    | 'diff-files'\n    | 'init'\n    | 'notes'\n    | 'request-pull'\n    | 'update-index'\n    | 'check-ignore'\n    | 'diff-index'\n    | 'init-db'\n    | 'p4'\n    | 'rerere'\n    | 'update-ref'\n    | 'check-mailmap'\n    | 'diff-tree'\n    | 'instaweb'\n    | 'pack-objects'\n    | 'reset'\n    | 'update-server-info'\n    | 'check-ref-format'\n    | 'difftool'\n    | 'interpret-trailers'\n    | 'pack-redundant'\n    | 'rev-list'\n    | 'upload-archive'\n    | 'checkout'\n    | 'difftool--helper'\n    | 'log'\n    | 'pack-refs'\n    | 'rev-parse'\n    | 'upload-pack'\n    | 'checkout-index'\n    | 'fast-export'\n    | 'ls-files'\n    | 'patch-id'\n    | 'revert'\n    | 'var'\n    | 'cherry'\n    | 'fast-import'\n    | 'ls-remote'\n    | 'prune'\n    | 'rm'\n    | 'verify-commit'\n    | 'cherry-pick'\n    | 'fetch'\n    | 'ls-tree'\n    | 'prune-packed'\n    | 'send-email'\n    | 'verify-pack'\n    | 'citool'\n    | 'fetch-pack'\n    | 'mailinfo'\n    | 'pull'\n    | 'send-pack'\n    | 'verify-tag'\n    | 'clean'\n    | 'filter-branch'\n    | 'mailsplit'\n    | 'push'\n    | 'sh-i18n--envsubst'\n    | 'web--browse'\n    | 'clone'\n    | 'fmt-merge-msg'\n    | 'merge'\n    | 'quiltimport'\n    | 'shell'\n    | 'whatchanged'\n    | 'column'\n    | 'for-each-ref'\n    | 'merge-base'\n    | 'read-tree'\n    | 'shortlog'\n    | 'write-tree'\n    | 'commit'\n    | 'format-patch'\n    | 'merge-file'\n    | 'rebase'\n    | 'show'\n    | '--version'\n    ;\n\nLS_OPTION\n    : '--help'\n    ;\n        ";
var Language = (function () {
    function Language() {
        this.parser = new jison.Parser(grammar);
    }
    Language.prototype.parse = function (input) {
        this.parser.parse(input);
    };
    Language.prototype.lex = function (input) {
        var lexer = this.parser.lexer;
        lexer.setInput(input);
        var lexemes = [];
        var lexeme = lexer.lex();
        while (typeof lexeme === 'string') {
            lexemes.push(lexeme);
            lexeme = lexer.lex();
        }
        if (input.endsWith(' ')) {
            lexemes.push('');
        }
        return lexemes;
    };
    Object.defineProperty(Language.prototype, "onParsingError", {
        set: function (handler) {
            this.parser.yy.parseError = handler;
        },
        enumerable: true,
        configurable: true
    });
    return Language;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Language;
