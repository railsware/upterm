import Language = require('./Language');
import i = require('./Interfaces');
import Aliases = require("./Aliases");

class ParsableString implements i.Parsable {
    static language = new Language();
    text: string;

    constructor(text: string) {
        this.text = text;
    }

    getLexemes(text = this.getText()): string[] {
        return ParsableString.language.lex(text);
    }

    getText(): string {
        return this.text;
    }

    getLastLexeme(): string {
        return this.getLexemes().slice(-1)[0] || '';
    }

    parse(): void {
        ParsableString.language.parse(this.expand());
    }

    expand(): string {
        return this.expandToArray().join(' ');
    }

    expandToArray(text = this.getText()): string[] {
        const args = this.getLexemes(text);

        const commandName = args.shift();
        const alias: string = Aliases.find(commandName);

        if (alias) {
            const aliasArgs = this.getLexemes(alias);
            const isRecursive = aliasArgs[0] == commandName;

            if (isRecursive) {
                return aliasArgs.concat(args);
            } else {
                return this.expandToArray(alias).concat(args);
            }
        } else {
            return [commandName, ...args];
        }
    }

    set onParsingError(handler: Function) {
        ParsableString.language.onParsingError = handler
    }
}

export = ParsableString
