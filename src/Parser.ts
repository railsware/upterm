import {Suggestion, type} from "./plugins/autocompletion_providers/Suggestions";
import * as _ from "lodash";
import {compose} from "./utils/Common";

export enum InputMethod {
    Typed,
    Autocompleted,
}

export interface Context {
    input: string;
    directory: string;
    historicalCurrentDirectoriesStack: string[];
    cdpath: string[];
    inputMethod: InputMethod;
}

enum Progress {
    Failed,
    OnStart,
    InProgress,
    Finished,
}

export type Parser = (context: Context) => Promise<Array<Result>>;

export interface Result {
    parser: Parser;
    context: Context;
    parse: string;
    progress: Progress;
    suggestions: Suggestion[];
}

function getProgress(input: string, expected: string) {
    if (expected.length === 0) {
        return Progress.Finished;
    }

    if (input.length === 0) {
        return Progress.OnStart;
    }

    if (input.startsWith(expected)) {
        return Progress.Finished;
    }

    if (expected.length <= input.length) {
        return Progress.Failed;
    }

    if (expected.startsWith(input)) {
        return Progress.InProgress;
    }

    return Progress.Failed;
}

export const string = (expected: string) => {
    const parser = async (context: Context): Promise<Array<Result>> => {
        const progress = getProgress(context.input, expected);

        return [{
            parser: parser,
            context: context,
            parse: progress === Progress.Finished ? expected : "",
            progress: progress,
            suggestions: (progress === Progress.Finished)
                ? (context.inputMethod === InputMethod.Autocompleted ? [] : [new Suggestion().withDisplayValue(expected).withValue("")])
                : [new Suggestion().withValue(expected)],
        }];
    };
    return parser;
};

export const bind = (left: Parser, rightGenerator: (result: Result) => Promise<Parser>) => async (context: Context): Promise<Array<Result>> => {
    const leftResults = await left(context);

    const results = await Promise.all(leftResults.map(async (leftResult) => {
        const rightInput = context.input.slice(leftResult.parse.length);

        if (leftResult.progress === Progress.Finished && (rightInput.length || leftResult.suggestions.length === 0)) {
            const right = await rightGenerator(leftResult);
            const rightResults = await right(Object.assign({}, leftResult.context, { input: rightInput }));

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
export const sequence = (left: Parser, right: Parser) => bind(left, async () => right);

export const choice = (parsers: Parser[]) => async (context: Context): Promise<Array<Result>> => {
    const results = await Promise.all(parsers.map(parser => parser(context)));

    return _.flatten(results).filter(result => result.progress !== Progress.Failed);
};

export const optional = (parser: Parser) => choice([string(""), parser]);
export const many1 = (parser: Parser): Parser => choice([parser, bind(parser, async () => many1(parser))]);
export const many = compose(many1, optional);

export const decorate = (parser: Parser, decorator: (s: Suggestion) => Suggestion) => async (context: Context): Promise<Array<Result>> => {
    const results = await parser(context);

    return results.map(result => ({
        parser: decorate(result.parser, decorator),
        context: result.context,
        parse: result.parse,
        progress: result.progress,
        suggestions: result.suggestions.map(decorator),
    }));
};

export const decorateResult = (parser: Parser, decorator: (c: Result) => Result) => async (context: Context): Promise<Array<Result>> => {
    return (await parser(context)).map(decorator);
};

export const withoutSuggestions = (parser: Parser) => decorateResult(parser, result => Object.assign({}, result, {suggestions: []}));

/**
 * Display suggestions only if a person has already input at least one character of the expected value.
 * Used to display easy and popular suggestions, which would add noise to the autocompletion box.
 *
 * @example cd ../
 * @example cd -
 */
export const noisySuggestions = (parser: Parser) => decorateResult(
    parser,
    result => Object.assign(
        {},
        result,
        {
            suggestions: (result.progress === Progress.InProgress || result.progress === Progress.Finished) ? result.suggestions : [],
        }
    )
);
export const spacesWithoutSuggestion = withoutSuggestions(many1(string(" ")));

export const runtime = (producer: (context: Context) => Promise<Parser>) => async (context: Context): Promise<Array<Result>> => {
    const parser = await producer(context);
    return parser(context);
};

export const optionalContinuation = (parser: Parser) => optional(sequence(spacesWithoutSuggestion, parser));
export const append = (suffix: string, parser: Parser) => decorate(sequence(parser, withoutSuggestions(string(suffix))), suggestion => suggestion.withValue(suggestion.value + suffix));
export const token = (parser: Parser) => decorate(sequence(parser, spacesWithoutSuggestion), suggestion => suggestion.withValue(suggestion.value + " "));
export const executable = (name: string) => decorate(token(string(name)), type("executable"));
export const commandSwitch = (value: string) => decorate(string(`--${value}`), type("option"));
export const option = (value: string) => decorate(string(`--${value}=`), type("option"));

export const debug = (parser: Parser) => async (context: Context) => {
    const results = await parser(context);

    if (_.some(results, result => result.suggestions.length !== 0)) {
        /* tslint:disable:no-debugger */
        debugger;
    }

    return results;
};
