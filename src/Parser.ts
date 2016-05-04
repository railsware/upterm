import {Suggestion, type} from "./plugins/autocompletion_providers/Suggestions";
import * as _ from "lodash";

interface Context {
    directory: string;
}

enum Progress {
    Failed,
    InProgress,
    Finished,
}

interface Result {
    parser: Parser;
    parse: string;
    progress: Progress;
    suggestions: Suggestion[];
}

abstract class Parser {
    abstract async derive(string: string, context: Context): Promise<Array<Result>>;

    sequence(parser: Parser): Parser {
        return new Sequence(this, parser);
    }

    decorate(decorator: (s: Suggestion) => Suggestion): Parser {
        return new SuggestionsDecorator(this, decorator);
    }
}

function getProgress(actual: string, expected: string) {
    if (expected.length === 0) {
        return Progress.Finished;
    }

    if (actual.startsWith(expected)) {
        return Progress.Finished;
    }

    if (expected.length <= actual.length) {
        return Progress.Failed;
    }

    if (expected.startsWith(actual)) {
        return Progress.InProgress;
    }

    return Progress.Failed;
}

class StringLiteral extends Parser {
    constructor(private string: string) {
        super();
    }

    async derive(input: string, context: Context): Promise<Array<Result>> {
        const progress = getProgress(input, this.string);

        return [{
            parser: this,
            parse: progress === Progress.Finished ? this.string : "",
            progress: progress,
            suggestions: [new Suggestion().withValue(this.string)],
        }];
    }
}

class Sequence extends Parser {
    constructor(private left: Parser, private right: Parser) {
        super();
    }

    async derive(input: string, context: Context): Promise<Array<Result>> {

        const leftResults = await this.left.derive(input, context);

        const results = await Promise.all(leftResults.map(async (leftResult) => {
            if (leftResult.progress === Progress.Finished) {
                const rightResults = await this.right.derive(input.slice(leftResult.parse.length), context);

                return rightResults.map(rightResult => ({
                    parser: rightResult.parser,
                    parse: leftResult.parse + rightResult.parse,
                    progress: rightResult.progress,
                    suggestions: rightResult.suggestions,
                }));
            } else {
                return [leftResult];
            }
        }));

        return _.flatten(results).filter(result => result.progress !== Progress.Failed);
    }
}

class Choice extends Parser {
    constructor(private parsers: Parser[]) {
        super();
    }

    async derive(string: string, context: Context): Promise<Array<Result>> {
        const results = await Promise.all(this.parsers.map(parser => parser.derive(string, context)));

        return _.flatten(results).filter(result => result.progress !== Progress.Failed);
    }
}

export const many1 = (parser: Parser) => new Many1(parser);

class Many1 extends Parser {
    constructor(private parser: Parser) {
        super();
    }

    async derive(string: string, context: Context): Promise<Array<Result>> {
        return await new Choice([this.parser, this.parser.sequence(new Many1(this.parser))]).derive(string, context);
    }
}

class SuggestionsDecorator extends Parser {
    constructor(private parser: Parser, private decorator: (s: Suggestion) => Suggestion) {
        super();
    }

    async derive(string: string, context: Context): Promise<Array<Result>> {
        const results = await this.parser.derive(string, context);
        return results.map(result => ({
            parser: new SuggestionsDecorator(result.parser, this.decorator),
            parse: result.parse,
            progress: result.progress,
            suggestions: result.suggestions.map(this.decorator),
        }));
    }
}

type DataSource = (context: Context) => Promise<string[]>;

class FromDataSource extends Parser {
    constructor(private parserConstructor: (s: string) => Parser, private source: DataSource) {
        super();
    }

    async derive(string: string, context: Context): Promise<Array<Result>> {
        const data = await this.source(context);
        const parser = new Choice(data.map(this.parserConstructor));
        return parser.derive(string, context);
    }
}

export const string = (value: string) => new StringLiteral(value);
export const choice = (parsers: Parser[]) => new Choice(parsers);
export const optional = (parser: Parser) => choice([string(""), parser]);
export const token = (value: string) => string(value).sequence(many1(string(" ")));
export const fromSource = (parserConstructor: (s: string) => Parser, source: DataSource) => new FromDataSource(parserConstructor, source);
export const executable = (name: string) => token(name).decorate(type("executable"));
export const option = (value: string) => string(`--${value}=`).decorate(type("option"));
export const subCommand = (value: string) => token(value).decorate(type("command"));
