import {reduceAsync} from "./utils/Common";
import {Suggestion} from "./plugins/autocompletion_providers/Suggestions";

type char = string;

abstract class Parser<T> {
    abstract get isValid(): boolean;
    abstract get isExhausted(): boolean;
    abstract async derive(char: char): Promise<Parser<T>>;
    abstract get suggestions(): Suggestion[];

    async parse(string: string): Promise<Parser<T>> {
        return reduceAsync(Array.from(string), this, (parser, char) => parser.derive(char));
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

    async derive(char: char) {
        return this;
    }

    get suggestions(): Suggestion[] {
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

    async derive(char: char) {
        return this;
    }

    get suggestions(): Suggestion[] {
        return [];
    }
}

class StringLiteral extends Valid<string> {
    constructor(private string: string, private startIndex = 0) {
        super();
    }

    async derive(char: char): Promise<Parser<string>> {
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

    get suggestions() {
        return [new Suggestion().withValue(this.string)];
    }
}

class Sequence<L, R> extends Valid<[L, R]> {
    constructor(private left: Parser<L>, private right: Parser<R>) {
        super();
    }

    async derive(char: char): Promise<Parser<[L, R]>> {
        const leftDerived = await this.left.derive(char);

        if (!leftDerived.isValid) {
            return leftDerived;
        }

        if (leftDerived.isExhausted) {
            return this.right;
        }

        return new Sequence(leftDerived, this.right);
    }

    get suggestions() {
        return this.left.suggestions;
    }
}

class Or<L, R> extends Valid<[L, R]> {
    constructor(private left: Parser<L>, private right: Parser<R>) {
        super();
    }

    async derive(char: char): Promise<Parser<[L, R]>> {
        const leftDerived = await this.left.derive(char);
        const rightDerived = await this.right.derive(char);

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

    get suggestions() {
        return this.left.suggestions.concat(this.right.suggestions);
    }
}

class SuggestionsDecorator<T> extends Valid<T> {
    constructor(private parser: Parser<T>, private decorator: (s: Suggestion) => Suggestion) {
        super();
    }

    async derive(char: char): Promise<Parser<T>> {
        const derived = await this.parser.derive(char);
        if (!derived.isValid) {
            return new Failure();
        }

        if (derived.isExhausted) {
            return new Success();
        }

        return new SuggestionsDecorator(derived, this.decorator);
    }

    get suggestions() {
        return this.parser.suggestions.map(this.decorator);
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
export const token = (value: string) => string(value).bind(string(" "));
