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

type Parser = (input: string, context: Context) => Promise<Array<Result>>;
type DataSource = (context: Context) => Promise<string[]>;

interface Result {
    parser: Parser;
    parse: string;
    progress: Progress;
    suggestions: Suggestion[];
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

export const string = (expected: string) => {
    const parser = async (actual: string, context: Context): Promise<Array<Result>> => {
        const progress = getProgress(actual, expected);

        return [{
            parser: parser,
            parse: progress === Progress.Finished ? expected : "",
            progress: progress,
            suggestions: [new Suggestion().withValue(expected)],
        }];
    };
    return parser;
};

export const sequence = (left: Parser, right: Parser) => async (input: string, context: Context): Promise<Array<Result>> => {
    const leftResults = await left(input, context);

    const results = await Promise.all(leftResults.map(async (leftResult) => {
        if (leftResult.progress === Progress.Finished) {
            const rightResults = await right(input.slice(leftResult.parse.length), context);

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
};

export const choice = (parsers: Parser[]) => async (actual: string, context: Context): Promise<Array<Result>> => {
    const results = await Promise.all(parsers.map(parser => parser(actual, context)));

    return _.flatten(results).filter(result => result.progress !== Progress.Failed);
};

export const many1 = (parser: Parser) => async (actual: string, context: Context): Promise<Array<Result>> => {
    return await choice([parser, sequence(parser, many1(parser))])(actual, context);
};

export const decorate = (parser: Parser, decorator: (s: Suggestion) => Suggestion) => async (actual: string, context: Context): Promise<Array<Result>> => {
    const results = await parser(actual, context);

    return results.map(result => ({
        parser: decorate(result.parser, decorator),
        parse: result.parse,
        progress: result.progress,
        suggestions: result.suggestions.map(decorator),
    }));
};

export const fromSource = (parserConstructor: (s: string) => Parser, source: DataSource) => async (actual: string, context: Context): Promise<Array<Result>> => {
    const data = await source(context);
    const parser = choice(data.map(parserConstructor));
    return parser(actual, context);
};

export const optional = (parser: Parser) => choice([string(""), parser]);
export const token = (value: string) => sequence(string(value), many1(string(" ")));
export const executable = (name: string) => decorate(token(name), type("executable"));
export const option = (value: string) => decorate(string(`--${value}=`), type("option"));
export const subCommand = (value: string) => decorate(token(value), type("command"));
