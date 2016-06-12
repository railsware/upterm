export abstract class Token {
    readonly raw: string;

    constructor(raw: string) {
        this.raw = raw;
    }

    abstract get value(): string;

    /**
     * @deprecated
     */
    abstract get escapedValue(): EscapedShellWord;

    get isComplete(): boolean {
        return this.raw.endsWith(" ");
    }
}

export class Word extends Token {
    get value() {
        return this.raw.trim().replace(/\\\s/, " ");
    }

    get escapedValue() {
        return <EscapedShellWord>this.raw.trim();
    }
}

export class Pipe extends Token {
    get value() {
        return this.raw.trim();
    }

    get escapedValue(): EscapedShellWord {
        return <EscapedShellWord>this.value;
    }
}

export class InputRedirectionSymbol extends Token {
    get value() {
        return this.raw.trim();
    }

    get escapedValue(): EscapedShellWord {
        return <EscapedShellWord>this.value;
    }
}

export class OutputRedirectionSymbol extends Token {
    get value() {
        return this.raw.trim();
    }

    get escapedValue(): EscapedShellWord {
        return <EscapedShellWord>this.value;
    }
}

export class AppendingOutputRedirectionSymbol extends Token {
    get value() {
        return this.raw.trim();
    }

    get escapedValue(): EscapedShellWord {
        return <EscapedShellWord>this.value;
    }
}

export abstract class StringLiteral extends Token {
    get value() {
        return this.raw.trim().slice(1, -1);
    }
}

export class SingleQuotedStringLiteral extends StringLiteral {
    get escapedValue(): EscapedShellWord {
        return <EscapedShellWord>`'${this.value}'`;
    }
}

export class DoubleQuotedStringLiteral extends StringLiteral {
    get escapedValue(): EscapedShellWord {
        return <EscapedShellWord>`"${this.value}"`;
    }
}

export class Invalid extends Token {
    get value() {
        return this.raw.trim();
    }

    get escapedValue(): EscapedShellWord {
        return <EscapedShellWord>this.value;
    }
}

export function scan(input: string): Token[] {
    const tokens: Token[] = [];

    while (true) {
        if (input.length === 0) {
            return tokens;
        }

        let match = input.match(/^(\s*\|\s*)/);
        if (match) {
            const token = match[1];
            tokens.push(new Pipe(token));
            input = input.slice(token.length);
            continue;
        }

        match = input.match(/^(\s*>>\s*)/);
        if (match) {
            const token = match[1];
            tokens.push(new AppendingOutputRedirectionSymbol(token));
            input = input.slice(token.length);
            continue;
        }

        match = input.match(/^(\s*<\s*)/);
        if (match) {
            const token = match[1];
            tokens.push(new InputRedirectionSymbol(token));
            input = input.slice(token.length);
            continue;
        }

        match = input.match(/^(\s*>\s*)/);
        if (match) {
            const token = match[1];
            tokens.push(new OutputRedirectionSymbol(token));
            input = input.slice(token.length);
            continue;
        }

        match = input.match(/^(\s*"(?:\\"|[^"])*"\s*)/);
        if (match) {
            const token = match[1];
            tokens.push(new DoubleQuotedStringLiteral(token));
            input = input.slice(token.length);
            continue;
        }

        match = input.match(/^(\s*'(?:\\'|[^'])*'\s*)/);
        if (match) {
            const token = match[1];
            tokens.push(new SingleQuotedStringLiteral(token));
            input = input.slice(token.length);
            continue;
        }

        match = input.match(/^(\s*(?:\\\s|[a-zA-Z0-9-=_/~.])+\s*)/);
        if (match) {
            const token = match[1];
            tokens.push(new Word(token));
            input = input.slice(token.length);
            continue;
        }

        tokens.push(new Invalid(input));
        input = "";
    }
}

export function concatTokens(left: Token[], right: Token[]): Token[] {
    return left.concat(right);
}
