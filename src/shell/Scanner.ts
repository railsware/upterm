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

export abstract class StringLiteral extends Token {
    get value() {
        return this.raw.trim().slice(1, -1);
    }
}

export class Word extends StringLiteral {
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

export class CompositeStringLiteral extends StringLiteral {
    private tokens: Token[];

    constructor(tokens: Token[]) {
        let raw = tokens.map(token => token.raw).join("");
        super(raw, tokens[0].fullStart);
        this.tokens = tokens;
    }

    get value() {
        return this.tokens.map(token => token.value).join("");
    }

    get escapedValue() {
        return this.tokens.map(token => token.escapedValue).join("") as EscapedShellWord;
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
        regularExpression: /^(\s*;)/,
        tokenConstructor: Semicolon,
    },
    {
        regularExpression: /^(\s*&&)/,
        tokenConstructor: And,
    },
    {
        regularExpression: /^(\s*\|\|)/,
        tokenConstructor: Or,
    },
    {
        regularExpression: /^(\s*>>)/,
        tokenConstructor: AppendingOutputRedirectionSymbol,
    },
    {
        regularExpression: /^(\s*<)/,
        tokenConstructor: InputRedirectionSymbol,
    },
    {
        regularExpression: /^(\s*[012]?>)/,
        tokenConstructor: OutputRedirectionSymbol,
    },
    {
        regularExpression: /^(\s*"(?:\\"|[^"])*")/,
        tokenConstructor: DoubleQuotedStringLiteral,
    },
    {
        regularExpression: /^(\s*'(?:\\'|[^'])*')/,
        tokenConstructor : SingleQuotedStringLiteral,
    },
    {
        regularExpression: /^(\s*(?:\\\(|\\\)|\\\s|[a-zA-Z0-9\u0080-\uFFFF+~!@#%^&*_=,.:/?\\-])+)/,
        tokenConstructor : Word,
    },
];

export function scan(input: string): Token[] {
    const tokens: Token[] = [];

    let position = 0;

    while (true) {
        if (input.length === 0) {
            return squashLiterals(tokens);
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
            return squashLiterals(tokens);
        }
    }
}

// Find sequences of literals with no spaces between them and squash:
// they should be one token.
function squashLiterals(tokens: Token[]): Token[] {
    let result: Token[] = [];
    let i: number = 0;
    while (i < tokens.length) {
        let currentComposite: Token[] = [];
        while (i < tokens.length - 1 && shouldSquash(tokens[i], tokens[i + 1])) {
            currentComposite.push(tokens[i++]);
        }
        if (currentComposite.length > 0) {
            currentComposite.push(tokens[i++]); // last token in the sequence
            result.push(new CompositeStringLiteral(currentComposite));
        }
        if (i < tokens.length) {
            result.push(tokens[i++]);
        }
    }
    return result;
}

function concatTokens(left: Token[], right: Token[]): Token[] {
    return left.concat(right);
}

function shouldSquash(left: Token, right: Token): boolean {
    return left instanceof StringLiteral
            && right instanceof StringLiteral
            && !/\s$/.test(left.raw) // ends with spaces
            && !/^\s/.test(right.raw); // starts with spaces
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

export function stringLiteralValue(literal: string): string | undefined {
    const tokens = scan(literal);

    if (tokens.length !== 1) {
        return;
    }

    const token = tokens[0];

    if (token instanceof DoubleQuotedStringLiteral) {
        return token.value;
    }

    if (token instanceof SingleQuotedStringLiteral) {
        return token.value;
    }

    if (token instanceof Word) {
        return token.value;
    }
}
