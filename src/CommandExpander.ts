const jison = require("jison");
import * as _ from "lodash";
import Aliases from "./Aliases";
import History from "./History";

const grammar = `
%lex
WORD [\\w/-]+
ESCAPED_SPACE \\\\\\s
%%
\\s+                            {/* skip whitespace */}
\\"[^\\"]+\\"                   { return yytext.slice(1, -1); }
\\'[^\\']+\\'                   { return yytext.slice(1, -1); }
({WORD}{ESCAPED_SPACE})+{WORD}  {return yytext.replace(/\\\\/g, '');}
[^\\s]+                         {return yytext;}
<<EOF>> {return 'EOF';}

/lex

%start COMMAND

%%

COMMAND
    : WORD EOF
    | WORD COMMAND
    ;
        `;

export let parser = new jison.Parser(grammar);
let lexer = parser.lexer;

export function expandHistory(lexemes: string[]): string[] {
    return _.flatten(lexemes.map(lexeme => historyReplacement(lexeme)));
}

export async function expandAliases(lexemes: string[]): Promise<string[]> {
    const commandName = lexemes[0];
    const args = lexemes.slice(1);
    const alias: string = await Aliases.find(commandName);

    if (alias) {
        const aliasArgs = lex(alias);
        const isRecursive = aliasArgs[0] === commandName;

        if (isRecursive) {
            return aliasArgs.concat(args);
        } else {
            return (await expandAliases(lex(alias))).concat(args);
        }
    } else {
        return [commandName, ...args];
    }
}

export function lex(input: string): string[] {
    lexer.setInput(input);

    let lexemes: string[] = [];
    let lexeme = lexer.lex();

    while (typeof lexeme === "string") {
        lexemes.push(lexeme);
        lexeme = lexer.lex();
    }

    if (input.endsWith(" ")) {
        lexemes.push("");
    }

    return lexemes;
}

export function isCompleteHistoryCommand(lexeme: string) {
    return ["!!", "!^", "!$", "!*"].includes(lexeme);
}

// FIXME: add recursive replacement, so that two !! in a row would work.
export function historyReplacement(lexeme: string): string[] {
    if (!isCompleteHistoryCommand(lexeme)) {
        return [lexeme];
    }

    const matcher = lexeme.substring(1);

    const position = parseInt(matcher, 10);
    if (!isNaN(position)) {
        return [History.at(position).raw];
    }

    const lastCommand = History.lastEntry;
    switch (lexeme) {
        case "!!":
            return lastCommand.historyExpanded;
        case "!^":
            return lastCommand.historyExpanded.slice(0, 1);
        case "!$":
            return [_.last(lastCommand.historyExpanded)];
        case "!*":
            return lastCommand.historyExpanded.slice(1);
        default:
            throw [History.lastWithPrefix(matcher).raw];
    }
}
