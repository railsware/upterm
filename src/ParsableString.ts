import Language = require('./Language');
import i = require('./Interfaces');

class ParsableString implements i.Parsable {
    static language = new Language();
    text: string;

    constructor(text: string) {
        this.text = text;
    }

    getLexemes(): string[] {
        return ParsableString.language.lex(this.text);
    }

    getText(): string {
        return this.text;
    }

    getLastLexeme(): string {
        return this.getLexemes().slice(-1)[0] || '';
    }

    parse(): void {
        ParsableString.language.parse(this.getText());
    }

    set onParsingError(handler: Function) {
        ParsableString.language.onParsingError = handler
    }
}

export = ParsableString
