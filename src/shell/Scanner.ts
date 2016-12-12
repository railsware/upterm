import {Aliases} from "./Aliases";

export abstract class Token {
    readonly raw: string;
    readonly fullStart: number;

    constructor(raw: string, fullStart: number) {
        this.raw = raw;
        this.fullStart = fullStart;
    }

    abstract get value(): string;

    /**
     * @deprecated
     */
    abstract get escapedValue(): EscapedShellWord;
}

export class Empty extends Token {
    constructor() {
        super("", 0);
    }

    get value() {
        return "";
    }

    get escapedValue() {
        return this.raw.trim() as EscapedShellWord;
    }
}

export class Word extends Token {
    get value() {
        return this.raw.trim().replace(/\\\s/g, " ");
    }

    get escapedValue() {
        return this.raw.trim() as EscapedShellWord;
    }
}

export class Pipe extends Token {
    get value() {
        return this.raw.trim();
    }

    get escapedValue(): EscapedShellWord {
        return this.value as EscapedShellWord;
    }
}

export class Semicolon extends Token {
    get value() {
        return this.raw.trim();
    }

    get escapedValue(): EscapedShellWord {
        return this.value as EscapedShellWord;
    }
}

export class And extends Token {
    get value() {
        return this.raw.trim();
    }

    get escapedValue(): EscapedShellWord {
        return this.value as EscapedShellWord;
    }
}

export class Or extends Token {
    get value() {
        return this.raw.trim();
    }

    get escapedValue(): EscapedShellWord {
        return this.value as EscapedShellWord;
    }
}

export class InputRedirectionSymbol extends Token {
    get value() {
        return this.raw.trim();
    }

    get escapedValue(): EscapedShellWord {
        return this.value as EscapedShellWord;
    }
}

export class OutputRedirectionSymbol extends Token {
    get value() {
        return this.raw.trim();
    }

    get escapedValue(): EscapedShellWord {
        return this.value as EscapedShellWord;
    }
}

export class AppendingOutputRedirectionSymbol extends Token {
    get value() {
        return this.raw.trim();
    }

    get escapedValue(): EscapedShellWord {
        return this.value as EscapedShellWord;
    }
}

export abstract class StringLiteral extends Token {
    get value() {
        return this.raw.trim().slice(1, -1);
    }
}

export class SingleQuotedStringLiteral extends StringLiteral {
    get escapedValue(): EscapedShellWord {
        return `'${this.value}'` as EscapedShellWord;
    }
}

export class DoubleQuotedStringLiteral extends StringLiteral {
    get escapedValue(): EscapedShellWord {
        return `"${this.value}"` as EscapedShellWord;
    }
}

export class Invalid extends Token {
    get value() {
        return this.raw.trim();
    }

    get escapedValue(): EscapedShellWord {
        return this.value as EscapedShellWord;
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
        regularExpression: /^(\s*&&\s*)/,
        tokenConstructor: And,
    },
    {
        regularExpression: /^(\s*\|\|\s*)/,
        tokenConstructor: Or,
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
        regularExpression: /^(\s*(?:\\\(|\\\)|\\\s|[a-zA-Z0-9\u0080-\uFFFF+~!@#%^&*_=,.:/?\\-])+\s*)/,
        tokenConstructor : Word,
    },
];

export function scan(input: string): Token[] {
    const tokens: Token[] = [];

    let position = 0;

    while (true) {
        if (input.length === 0) {
            return tokens;
        }

        let foundMatch = false;
        for (const pattern of patterns) {
            const match = input.match(pattern.regularExpression);

            if (match) {
                const token = match[1];
                tokens.push(new pattern.tokenConstructor(token, position));
                position += token.length;
                input = input.slice(token.length);
                foundMatch = true;
                break;
            }
        }

        if (!foundMatch) {
            tokens.push(new Invalid(input, position));
            return tokens;
        }
    }
}

function concatTokens(left: Token[], right: Token[]): Token[] {
    return left.concat(right);
}

export function expandAliases(tokens: Token[], aliases: Aliases): Token[] {
    if (tokens.length === 0) {
        return [];
    }

    const commandWordToken = tokens[0];
    const argumentTokens = tokens.slice(1);

    if (aliases.has(commandWordToken.value)) {
        const alias = aliases.get(commandWordToken.value);
        const aliasTokens = scan(alias);
        const isRecursive = aliasTokens[0].value === commandWordToken.value;

        if (isRecursive) {
            return concatTokens(aliasTokens, argumentTokens);
        } else {
            return concatTokens(expandAliases(scan(alias), aliases), argumentTokens);
        }
    } else {
        return tokens;
    }
}
