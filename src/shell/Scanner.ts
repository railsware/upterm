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

export class Semicolon extends Token {
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

const patterns = [
    {
        regularExpression: /^(\s*\|\s*)/,
        tokenConstructor: Pipe,
    },
    {
        regularExpression: /^(\s*;\s*)/,
        tokenConstructor: Semicolon,
    },
    {
        regularExpression: /^(\s*>>\s*)/,
        tokenConstructor: AppendingOutputRedirectionSymbol,
    },
    {
        regularExpression: /^(\s*<\s*)/,
        tokenConstructor: InputRedirectionSymbol,
    },
    {
        regularExpression: /^(\s*>\s*)/,
        tokenConstructor: OutputRedirectionSymbol,
    },
    {
        regularExpression: /^(\s*"(?:\\"|[^"])*"\s*)/,
        tokenConstructor: DoubleQuotedStringLiteral,
    },
    {
        regularExpression: /^(\s*'(?:\\'|[^'])*'\s*)/,
        tokenConstructor : SingleQuotedStringLiteral,
    },
    {
        regularExpression: /^(\s*(?:\\\s|[a-zA-Z0-9-=_/~.])+\s*)/,
        tokenConstructor : Word,
    },
];

export function scan(input: string): Token[] {
    const tokens: Token[] = [];

    while (true) {
        if (input.length === 0) {
            return tokens;
        }

        let foundMatch = false;
        for (const pattern of patterns) {
            const match = input.match(pattern.regularExpression);

            if (match) {
                const token = match[1];
                tokens.push(new pattern.tokenConstructor(token));
                input = input.slice(token.length);
                foundMatch = true;
                break;
            }
        }

        if (!foundMatch) {
            tokens.push(new Invalid(input));
            return tokens;
        }
    }
}

export function concatTokens(left: Token[], right: Token[]): Token[] {
    return left.concat(right);
}
