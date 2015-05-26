import Utils = require('../Utils');
import i = require('../Interfaces');
import _ = require('lodash')
var jison = require("jison");

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
    ;

GIT_OPTION
    : 'commit'
    | '--help'
    ;

LS_OPTION
    : '--help'
    ;
        `;

class Command implements i.AutocompletionProvider {
    parser: any;
    suggestions: i.Suggestion[];

    constructor() {
        this.parser = new jison.Parser(grammar);
        this.suggestions = [];
        this.parser.yy.parseError = (err: any, hash: any) => {
            var filtered = _(hash.expected).filter((value: string) => {
                return _.include(value, hash.token);
            }).map((value: string) => {
                return /^'(.*)'$/.exec(value)[1]
            }).value();

            this.suggestions = _.map(filtered, (value: string) => {
                return {
                    value: value,
                    priority: 0,
                    synopsis: '',
                    description: '',
                    type: value.startsWith('-') ? 'option' : 'command'
                };
            });
        };
    }

    getSuggestions(currentDirectory: string, input: string) {
        return new Promise((resolve) => {
            try {
                this.parser.parse(input);
                resolve([]);
            } catch (exception) {
                resolve(this.suggestions);
            }
        });
    }
}

export = Command;
