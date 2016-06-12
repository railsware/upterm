export abstract class Token {
    constructor(protected raw: string) {
    }

    abstract get value(): string;
}

export class Word extends Token {
    get value() {
        return this.raw.trim().replace(/\\\s/, " ");
    }
}

export class Pipe extends Token {
    get value() {
        return this.raw.trim();
    }
}

export class InputRedirectionSymbol extends Token {
    get value() {
        return this.raw.trim();
    }
}

export class OutputRedirectionSymbol extends Token {
    get value() {
        return this.raw.trim();
    }
}

export class AppendingOutputRedirectionSymbol extends Token {
    get value() {
        return this.raw.trim();
    }
}

export class StringLiteral extends Token {
    get value() {
        return this.raw.trim().slice(1, -1);
    }
}

export class SingleQuotedStringLiteral extends StringLiteral {
}

export class DoubleQuotedStringLiteral extends StringLiteral {
}

export class EndOfInput extends Token {
    get value() {
        return this.raw.trim();
    }
}

export function scan(input: string): Token[] {
    const tokens: Token[] = [];

    while (true) {
        let match = input.match(/^\s*$/);
        if (match) {
            tokens.push(new EndOfInput(input));
            return tokens;
        }

        match = input.match(/^(\s*\|)/);
        if (match) {
            const token = match[1];
            tokens.push(new Pipe(token));
            input = input.slice(token.length);
            continue;
        }

        match = input.match(/^(\s*>>)/);
        if (match) {
            const token = match[1];
            tokens.push(new AppendingOutputRedirectionSymbol(token));
            input = input.slice(token.length);
            continue;
        }

        match = input.match(/^(\s*<)/);
        if (match) {
            const token = match[1];
            tokens.push(new InputRedirectionSymbol(token));
            input = input.slice(token.length);
            continue;
        }

        match = input.match(/^(\s*>)/);
        if (match) {
            const token = match[1];
            tokens.push(new OutputRedirectionSymbol(token));
            input = input.slice(token.length);
            continue;
        }

        match = input.match(/^(\s*"(?:\\"|[^"])*")/);
        if (match) {
            const token = match[1];
            tokens.push(new DoubleQuotedStringLiteral(token));
            input = input.slice(token.length);
            continue;
        }

        match = input.match(/^(\s*'(?:\\'|[^'])*')/);
        if (match) {
            const token = match[1];
            tokens.push(new SingleQuotedStringLiteral(token));
            input = input.slice(token.length);
            continue;
        }

        match = input.match(/^(\s*(?:\\\s|[a-zA-Z0-9-=_/~.])+)/);
        if (match) {
            const token = match[1];
            tokens.push(new Word(token));
            input = input.slice(token.length);
            continue;
        }
    }
}

export function withoutEndOfInput(tokens: Token[]) {
    return tokens.slice(0, -1);
}

export function concatTokens(left: Token[], right: Token[]): Token[] {
    return withoutEndOfInput(left).concat(right);
}
