import {Suggestion, type} from "./plugins/autocompletion_providers/Suggestions";
import * as _ from "lodash";

export interface Context {
    directory: string;
}

enum Progress {
    Failed,
    InProgress,
    Finished,
}

type Parser = (input: string, context: Context) => Promise<Array<Result>>;

interface Result {
    parser: Parser;
    context: Context;
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
            context: context,
            parse: progress === Progress.Finished ? expected : "",
            progress: progress,
            suggestions: (progress === Progress.Finished)
                ? [new Suggestion().withValue(expected).noop]
                : [new Suggestion().withValue(expected)],
        }];
    };
    return parser;
};

export const sequence = (left: Parser, right: Parser) => async (actual: string, context: Context): Promise<Array<Result>> => {
    const leftResults = await left(actual, context);

    const results = await Promise.all(leftResults.map(async (leftResult) => {
        const rightActual = actual.slice(leftResult.parse.length);

        if (leftResult.progress === Progress.Finished && (rightActual.length || leftResult.suggestions.length === 0)) {
            const rightResults = await right(rightActual, leftResult.context);

            return rightResults.map(rightResult => ({
                parser: rightResult.parser,
                context: rightResult.context,
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
        context: result.context,
        parse: result.parse,
        progress: result.progress,
        suggestions: result.suggestions.map(decorator),
    }));
};

export const decorateResult = (parser: Parser, decorator: (c: Result) => Result) => async (actual: string, context: Context): Promise<Array<Result>> => {
    return (await parser(actual, context)).map(decorator);
};

export const withoutSuggestions = (parser: Parser) => decorateResult(parser, result => Object.assign({}, result, {suggestions: []}));
export const spacesWithoutSuggestion = withoutSuggestions(many1(string(" ")));

export const runtime = (producer: (context: Context) => Promise<Parser>) => async (actual: string, context: Context): Promise<Array<Result>> => {
    const parser = await producer(context);
    return parser(actual, context);
};

export const optional = (parser: Parser) => choice([string(""), parser]);
export const append = (suffix: string, parser: Parser) => decorate(sequence(parser, withoutSuggestions(string(suffix))), suggestion => suggestion.withValue(suggestion.value + suffix));
export const token = (parser: Parser) => decorate(sequence(parser, spacesWithoutSuggestion), suggestion => suggestion.withValue(suggestion.value + " "));
export const executable = (name: string) => decorate(token(string(name)), type("executable"));
export const commandSwitch = (value: string) => decorate(string(`--${value}`), type("option"));
export const option = (value: string) => decorate(string(`--${value}=`), type("option"));

export const debug = (parser: Parser) => async (actual: string, context: Context) => {
    const results = await parser(actual, context);

    if (_.some(results, result => result.suggestions.length !== 0)) {
        /* tslint:disable:no-debugger */
        debugger;
    }

    return results;
};
