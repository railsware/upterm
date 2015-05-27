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
    : 'commit'
    | 'status'
    | '--help'
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

        return lexemes;
    }

    set onParsingError(handler: Function) {
        this.parser.yy.parseError = handler;
    }
}

export = Language

