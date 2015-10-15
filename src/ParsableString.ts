import Language from './Language';
import * as i from './Interfaces';
import Aliases from "./Aliases";

export default class ParsableString {
    private static language = new Language();
    private text: string;
    private _lexemes: string[];

    constructor(text: string) {
        this.text = text;
        this._lexemes = ParsableString.language.lex(text);
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
        ParsableString.language.parse(this.expandToArray().join(' '));
    }

    // TODO: it doesn't belong here.
    expandToArray(text = this.getText()): string[] {
        const args = ParsableString.language.lex(text);

        const commandName = args.shift();
        const alias: string = Aliases.find(commandName);

        if (alias) {
            const aliasArgs = ParsableString.language.lex(alias);
            const isRecursive = aliasArgs[0] === commandName;

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
