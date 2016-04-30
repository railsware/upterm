import {Suggestion, type} from "./plugins/autocompletion_providers/Suggestions";
import {commonPrefix} from "./utils/Common";

interface Context {
    directory: string;
}

interface Result {
    parser: Parser;
    rest: string;
    parsed: string;
}

type DataSource = (context: Context) => Promise<string[]>;

abstract class Parser {
    abstract get isValid(): boolean;
    abstract get isExhausted(): boolean;
    abstract async derive(string: string, context: Context): Promise<Result>;
    abstract async suggestions(context: Context): Promise<Suggestion[]>;

    bind(parser: Parser): Parser {
        return new Sequence(this, parser);
    }

    or(parser: Parser): Parser {
        return new Or(this, parser);
    }

    decorate(decorator: (s: Suggestion) => Suggestion): Parser {
        return new SuggestionsDecorator(this, decorator);
    }

    async parse(string: string, context: Context): Promise<Result> {
        const result = await this.derive(string, context);

        if (!result.parser.isValid || result.parser.isExhausted || !result.rest) {
            return result;
        }

        return await result.parser.parse(result.rest, context);
    }
}

abstract class Valid extends Parser {
    get isValid() {
        return true;
    }

    get isExhausted() {
        return false;
    }
}

class Success extends Parser {
    get isValid() {
        return true;
    }

    get isExhausted() {
        return true;
    }

    async derive(string: string, context: Context): Promise<Result> {
        return {
            parser: new Failure(),
            rest: string,
            parsed: "",
        };
    }

    async suggestions(context: Context): Promise<Suggestion[]> {
        return [];
    }
}

class Nothing extends Valid {
    async derive(string: string, context: Context): Promise<Result> {
        return {
            parser: new Success(),
            rest: string,
            parsed: "",
        };
    }

    async suggestions(context: Context): Promise<Suggestion[]> {
        return [];
    }
}
const nothing = new Nothing();

class Failure extends Parser {
    get isValid() {
        return false;
    }

    get isExhausted() {
        return false;
    }

    async derive(string: string, context: Context): Promise<Result> {
        return {
            parser: this,
            rest: string,
            parsed: "",
        };
    }

    async suggestions(context: Context): Promise<Suggestion[]> {
        return [];
    }
}

class StringLiteral extends Valid {
    constructor(private string: string, private startIndex = 0) {
        super();
    }

    async derive(string: string, context: Context): Promise<Result> {
        if (this.string.length === 0) {
            return {
                parser: new Success(),
                rest: string,
                parsed: "",
            };
        }

        const substring = this.string.slice(this.startIndex);
        const prefix = commonPrefix(string, substring);

        if (prefix) {
            if (prefix === substring) {
                return {
                    parser: nothing,
                    rest: string.slice(prefix.length),
                    parsed: prefix,
                };
            } else if (prefix === string) {
                return {
                    parser: new StringLiteral(this.string, this.startIndex + prefix.length),
                    rest: string.slice(prefix.length),
                    parsed: prefix,
                };
            } else {
                return {
                    parser: new Failure(),
                    rest: string.slice(prefix.length),
                    parsed: prefix,
                };
            }
        } else {
            return {
                parser: new Failure(),
                rest: string.slice(prefix.length),
                parsed: prefix,
            };
        }
    }

    async suggestions(context: Context): Promise<Suggestion[]> {
        return [new Suggestion().withValue(this.string)];
    }
}

class Sequence extends Valid {
    constructor(private left: Parser, private right: Parser) {
        super();
    }

    async derive(string: string, context: Context): Promise<Result> {
        const leftResult = await this.left.derive(string, context);

        if (!leftResult.parser.isValid) {
            return leftResult;
        }

        if (!leftResult.parser.isExhausted) {
            return {
                parser: new Sequence(leftResult.parser, this.right),
                rest: leftResult.rest,
                parsed: leftResult.parsed,
            };
        }

        return await this.right.derive(leftResult.rest, context);
    }

    async suggestions(context: Context): Promise<Suggestion[]> {
        return this.left.suggestions(context);
    }
}

class Or extends Valid {
    constructor(private left: Parser, private right: Parser) {
        super();
    }

    async derive(string: string, context: Context): Promise<Result> {
        const leftResult = await this.left.derive(string, context);
        const rightResult = await this.right.derive(string, context);

        if (!leftResult.parser.isValid) {
            return rightResult;
        }

        if (!rightResult.parser.isValid) {
            return leftResult;
        }

        return {
            parser: new Or(leftResult.parser, rightResult.parser),
            rest: rightResult.rest,
            parsed: rightResult.parsed,
        };
    }

    async suggestions(context: Context): Promise<Suggestion[]> {
        const leftSuggestions = await this.left.suggestions(context);
        const rightSuggestions = await this.right.suggestions(context);

        return leftSuggestions.concat(rightSuggestions);
    }
}

export const many = (value: string) => new Many(value);

class Many extends Valid {
    constructor(private string: string) {
        super();
    }

    async derive(string: string, context: Context): Promise<Result> {
        return await new Or(new StringLiteral(this.string), new StringLiteral(this.string).bind(new Many(this.string))).derive(string, context);
    }

    async suggestions(context: Context): Promise<Suggestion[]> {
        return [];
    }
}

class SuggestionsDecorator extends Valid {
    constructor(private parser: Parser, private decorator: (s: Suggestion) => Suggestion) {
        super();
    }

    async derive(string: string, context: Context): Promise<Result> {
        const result = await this.parser.derive(string, context);
        if (!result.parser.isValid) {
            return {
                parser: new Failure(),
                rest: result.rest,
                parsed: result.parsed,
            };
        }

        if (result.parser.isExhausted) {
            return {
                parser: new Success(),
                rest: result.rest,
                parsed: result.parsed,
            };
        }

        return {
            parser: new SuggestionsDecorator(result.parser, this.decorator),
            rest: result.rest,
            parsed: result.parsed,
        };
    }

    async suggestions(context: Context): Promise<Suggestion[]> {
        const suggestions = await this.parser.suggestions(context);

        return suggestions.map(this.decorator);
    }
}

class FromDataSource extends Valid {
    constructor(private parserConstructor: (s: string) => Parser, private source: DataSource) {
        super();
    }

    async derive(string: string, context: Context): Promise<Result> {
        const parser = await this.getParser(context);
        return parser.derive(string, context);
    }

    async suggestions(context: Context): Promise<Suggestion[]> {
        const parser = await this.getParser(context);
        return parser.suggestions(context);
    }

    private async getParser(context: Context): Promise<Parser> {
        const data = await this.source(context);
        return choice(data.map(this.parserConstructor));
    }
}

export const string = (value: string) => new StringLiteral(value);
export const or = (left: Parser, right: Parser) => new Or(left, right);
export const optional = (value: string) => or(nothing, string(value));
export const token = (value: string) => string(`${value} `);
export const fromSource = (parserConstructor: (s: string) => Parser, source: DataSource) => new FromDataSource(parserConstructor, source);
export const choice = (parsers: Parser[]): Parser => {
    if (parsers.length === 0) {
        return new Failure();
    } else if (parsers.length === 1) {
        return parsers[0];
    } else {
        return parsers.reduce((left, right) => or(left, right));
    }
};


export const executable = (name: string) => token(name).decorate(type("executable"));
export const option = (value: string) => string(`--${value}=`).decorate(type("option"));
export const subCommand = (value: string) => token(value).decorate(type("command"));
