import {Suggestion, styles, style} from "./plugins/autocompletion_providers/Suggestions";
import * as _ from "lodash";
import {compose} from "./utils/Common";
import {Environment} from "./Environment";

export enum InputMethod {
    Typed,
    Autocompleted,
}

export interface Context {
    input: string;
    directory: string;
    historicalCurrentDirectoriesStack: string[];
    environment: Environment;
    inputMethod: InputMethod;
}

export enum Progress {
    Failed,
    OnStart,
    InProgress,
    Finished,
}

export type Parser = (context: Context) => Promise<Array<Result>>;

export interface Result {
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
    const results: Result[] = [];

    for (const leftResult of leftResults) {
        const rightInput = context.input.slice(leftResult.parse.length);

        if (leftResult.progress === Progress.Finished && (rightInput.length || leftResult.suggestions.length === 0)) {
            const right = await rightGenerator(leftResult);
            const rightResults = await right(Object.assign({}, context, { input: rightInput }));

            for (const rightResult of rightResults) {
                if (rightResult.progress !== Progress.Failed) {
                    results.push({
                        parse: leftResult.parse + rightResult.parse,
                        progress: rightResult.progress,
                        suggestions: rightResult.suggestions,
                    });
                }
            }
        } else {
            if (leftResult.progress !== Progress.Failed) {
                results.push(leftResult);
            }
        }
    }

    return results;
};

export const sequence = (left: Parser, right: Parser) => bind(left, async () => right);

export const choice = (parsers: Parser[]) => async (context: Context): Promise<Array<Result>> => {
    const results: Result[] = [];

    for (const parser of parsers) {
        const parserResults = await parser(context);

        for (const result of parserResults) {
            if (result.progress !== Progress.Failed) {
                results.push(result);
            }
        }
    }

    return results;
};

const last = (parser: Parser): Parser => async (context: Context): Promise<Array<Result>> => {
    const results = await parser(context);
    return results.slice(results.length - 1);
};

const shortCircuitOnEmptyInput = (parser: Parser): Parser => async(context: Context): Promise<Array<Result>> => {
    if (context.input.length === 0) {
        return [];
    }

    return parser(context);
};

export const many1 = (parser: Parser): Parser => choice([parser, bind(parser, async () => many1(parser))]);

export const decorate = (parser: Parser, decorator: (s: Suggestion) => Suggestion) => async (context: Context): Promise<Array<Result>> => {
    const results = await parser(context);

    return results.map(result => ({
        parse: result.parse,
        progress: result.progress,
        suggestions: result.suggestions.map(decorator),
    }));
};

export const decorateResult = (parser: Parser, decorator: (c: Result) => Result) => async (context: Context): Promise<Array<Result>> => {
    return (await parser(context)).map(decorator);
};

export const withoutSuggestions = (parser: Parser) => decorateResult(parser, result => Object.assign({}, result, {suggestions: []}));
export const optional = (parser: Parser) => choice([withoutSuggestions(string("")), parser]);
export const many = compose(many1, optional);

/**
 * Display suggestions only if a person has already input at least one character of the expected value.
 * Used to display easy and popular suggestions, which would add noise to the autocompletion box.
 *
 * @example cd ../
 * @example cd -
 */
export const noisySuggestions = (parser: Parser) => shortCircuitOnEmptyInput(decorateResult(
    parser,
    result => Object.assign(
        {},
        result,
        {
            suggestions: (result.progress !== Progress.OnStart && result.progress !== Progress.Failed) ? result.suggestions : [],
        }
    )
));
export const spacesWithoutSuggestion = withoutSuggestions(last(many1(string(" "))));

export const runtime = (producer: (context: Context) => Promise<Parser>) => async (context: Context): Promise<Array<Result>> => {
    const parser = await producer(context);
    return parser(context);
};

export const optionalContinuation = (parser: Parser) => optional(sequence(spacesWithoutSuggestion, parser));
export const token = (parser: Parser) => decorate(sequence(parser, spacesWithoutSuggestion), suggestion => suggestion.withValue(suggestion.value + " "));
export const executable = (name: string) => decorate(token(string(name)), style(styles.executable));
export const commandSwitch = (value: string) => decorate(string(`--${value}`), style(styles.option));
export const option = (value: string) => decorate(string(`--${value}=`), style(styles.option));

export const debug = (parser: Parser, tag = "debugged") => async (context: Context) => {
    window.DEBUG = true;

    const results = await decorate(parser, suggestion => suggestion.withDebugTag(tag))(context);

    if (_.some(results, result => result.suggestions.length !== 0)) {
        /* tslint:disable:no-debugger */
        debugger;
    }

    return results;
};
