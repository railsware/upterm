import Language = require('./Language');
import i = require('./Interfaces');

class ParsableString implements i.Parsable {
    language = new Language();
    text: string;

    constructor(text: string) {
        this.text = text;
    }

    getLexemes(): string[] {
        return this.language.lex(this.text);
    }

    getText(): string {
        return this.text;
    }

    getLastLexeme(): string {
        return this.getLexemes().slice(-1)[0] || '';
    }

    parse(): void {
        this.language.parse(this.getText());
    }

    set onParsingError(handler: Function) {
        this.language.onParsingError = handler
    }
}

export = ParsableString
