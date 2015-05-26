var jison = require("jison");
import i = require('./Interfaces');
import _ = require('lodash');

var grammar = `
%lex
%%
\\s+    {/* skip whitespace */}
\\w+    {return yytext;}
<<EOF>> {return 'EOF';}

/lex

%start COMMAND

%%

COMMAND
    : 'git' GIT_OPTION EOF
    | 'hub' GIT_OPTION EOF
    | 'ls'  LS_OPTION EOF
    | 'bundle' 'exec' COMMAND
    ;

GIT_OPTION
    : 'commit'
    | '--help'
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

    lex(input: string): i.Lexeme[] {
        var lexer = this.parser.lexer;
        lexer.setInput(input);
        var rawLexemes: string[] = [];
        var lexeme = lexer.lex();

        while(typeof lexeme === 'string') {
            rawLexemes.push(lexeme);
            lexeme = lexer.lex();
        }

        return _.map(rawLexemes, (lexeme) => {
            return {
                value: lexeme
            };
        })
    }

    set onParsingError(handler: Function) {
        this.parser.yy.parseError = handler;
    }
}

export = Language
