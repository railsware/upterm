import {reduceAsync} from "./utils/Common";
import {Suggestion} from "./plugins/autocompletion_providers/Suggestions";

type char = string;
interface ParsingContext {
    directory: string;
}

abstract class Parser<T> {
    abstract get isValid(): boolean;
    abstract get isExhausted(): boolean;
    abstract async derive(char: char, context: ParsingContext): Promise<Parser<T>>;
    abstract async suggestions(context: ParsingContext): Promise<Suggestion[]>;

    async parse(string: string, context: ParsingContext): Promise<Parser<T>> {
        return reduceAsync(Array.from(string), this, (parser, char) => parser.derive(char, context));
    }

    bind<U>(parser: Parser<U>): Parser<[T, U]> {
        return new Sequence(this, parser);
    }

    or<U>(parser: Parser<U>): Parser<[T, U]> {
        return new Or(this, parser);
    }

    decorate(decorator: (s: Suggestion) => Suggestion): Parser<T> {
        return new SuggestionsDecorator(this, decorator);
    }
}

abstract class Valid<T> extends Parser<T> {
    get isValid() {
        return true;
    }

    get isExhausted() {
        return false;
    }
}

class Success<T> extends Parser<T> {
    get isValid() {
        return true;
    }

    get isExhausted() {
        return true;
    }

    async derive(char: char, context: ParsingContext) {
        return this;
    }

    async suggestions(context: ParsingContext): Promise<Suggestion[]> {
        return [];
    }
}

class Failure<T> extends Parser<T> {
    get isValid() {
        return false;
    }

    get isExhausted() {
        return false;
    }

    async derive(char: char, context: ParsingContext) {
        return this;
    }

    async suggestions(context: ParsingContext): Promise<Suggestion[]> {
        return [];
    }
}

class StringLiteral extends Valid<string> {
    constructor(private string: string, private startIndex = 0) {
        super();
    }

    async derive(char: char, context: ParsingContext): Promise<Parser<string>> {
        if (this.string.charAt(this.startIndex) === char) {
            if (this.startIndex === this.string.length - 1) {
                return new Success();
            } else {
                return new StringLiteral(this.string, this.startIndex + 1);
            }
        } else {
            return new Failure();
        }
    }

    async suggestions(context: ParsingContext): Promise<Suggestion[]> {
        return [new Suggestion().withValue(this.string)];
    }
}

class Sequence<L, R> extends Valid<[L, R]> {
    constructor(private left: Parser<L>, private right: Parser<R>) {
        super();
    }

    async derive(char: char, context: ParsingContext): Promise<Parser<[L, R]>> {
        const leftDerived = await this.left.derive(char, context);

        if (!leftDerived.isValid) {
            return leftDerived;
        }

        if (leftDerived.isExhausted) {
            return this.right;
        }

        return new Sequence(leftDerived, this.right);
    }

    async suggestions(context: ParsingContext): Promise<Suggestion[]> {
        return this.left.suggestions(context);
    }
}

class Or<L, R> extends Valid<[L, R]> {
    constructor(private left: Parser<L>, private right: Parser<R>) {
        super();
    }

    async derive(char: char, context: ParsingContext): Promise<Parser<[L, R]>> {
        const leftDerived = await this.left.derive(char, context);
        const rightDerived = await this.right.derive(char, context);

        if (!leftDerived.isValid) {
            return rightDerived;
        }

        if (!rightDerived.isValid) {
            return leftDerived;
        }

        if (leftDerived.isExhausted || rightDerived.isExhausted) {
            return new Success();
        }

        return new Or(leftDerived, rightDerived);
    }

    async suggestions(context: ParsingContext): Promise<Suggestion[]> {
        const leftSuggestions = await this.left.suggestions(context);
        const rightSuggestions = await this.right.suggestions(context);

        return leftSuggestions.concat(rightSuggestions);
    }
}

class SuggestionsDecorator<T> extends Valid<T> {
    constructor(private parser: Parser<T>, private decorator: (s: Suggestion) => Suggestion) {
        super();
    }

    async derive(char: char, context: ParsingContext): Promise<Parser<T>> {
        const derived = await this.parser.derive(char, context);
        if (!derived.isValid) {
            return new Failure();
        }

        if (derived.isExhausted) {
            return new Success();
        }

        return new SuggestionsDecorator(derived, this.decorator);
    }

    async suggestions(context: ParsingContext): Promise<Suggestion[]> {
        const suggestions = await this.parser.suggestions(context);

        return suggestions.map(this.decorator);
    }
}

export const string = (value: string) => new StringLiteral(value);
export const choice = <T>(parsers: Parser<T>[]): Parser<T> => {
    if (parsers.length === 0) {
        return new Failure();
    } else if (parsers.length === 1) {
        return parsers[0];
    } else {
        return parsers.reduce((left, right) => new Or(left, right));
    }
};
export const token = (value: string) => string(`${value} `);
export const executable = (name: string) => token(name).decorate(suggestion => suggestion.withType("executable"));
export const option = (value: string) => string(`--${value}=`).decorate(suggestion => suggestion.withType("option"));
export const subCommand = (value: string) => token(value).decorate(suggestion => suggestion.withType("command"));

type DataSource = (context: ParsingContext) => Promise<string[]>;

class FromDataSource<T> extends Valid<T> {
    constructor(private parserConstructor: (s: string) => Parser<T>, private source: DataSource) {
        super();
    }

    async derive(char: char, context: ParsingContext): Promise<Parser<T>> {
        const parser = await this.getParser(context);
        return parser.derive(char, context);
    }

    async suggestions(context: ParsingContext): Promise<Suggestion[]> {
        const parser = await this.getParser(context);
        return parser.suggestions(context);
    }

    private async getParser(context: ParsingContext): Promise<Parser<T>> {
        const data = await this.source(context);
        return choice(data.map(this.parserConstructor));
    }
}

export const fromSource = <T>(parserConstructor: (s: string) => Parser<T>, source: DataSource) => new FromDataSource(parserConstructor, source);
