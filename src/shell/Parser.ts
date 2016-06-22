import {Suggestion, styles, style} from "../plugins/autocompletion_providers/Suggestions";
import * as _ from "lodash";
import {Environment} from "../Environment";
import {OrderedSet} from "../utils/OrderedSet";
import {Token, concatTokens} from "./Scanner";

export class Context {
    private _input: Token[];
    private _directory: string;
    private _historicalCurrentDirectoriesStack: OrderedSet<string>;
    private _environment: Environment;

    constructor(
        input: Token[],
        directory: string,
        historicalCurrentDirectoriesStack: OrderedSet<string>,
        environment: Environment
    ) {
        this._input = input;
        this._directory = directory;
        this._historicalCurrentDirectoriesStack = historicalCurrentDirectoriesStack;
        this._environment = environment;
    }

    get historicalCurrentDirectoriesStack(): OrderedSet<string> {
        return this._historicalCurrentDirectoriesStack;
    }

    get environment(): Environment {
        return this._environment;
    }

    get directory(): string {
        return this._directory;
    }

    get input(): Token[] {
        return this._input;
    }

    withInput(input: Token[]): Context {
        return new Context(
            input,
            this.directory,
            this.historicalCurrentDirectoriesStack,
            this.environment
        );
    }
}

export enum Progress {
    Failed,
    OnStart,
    InProgress,
    Finished,
}

export type Parser = (context: Context) => Promise<Array<Result>>;

export class Result {
    private _parse: Token[];
    private _progress: Progress;
    private _suggestions: Suggestion[];

    constructor(parse: Token[], progress: Progress, suggestions: Suggestion[]) {
        this._parse = parse;
        this._progress = progress;
        this._suggestions = suggestions;
    }

    get parse(): Token[] {
        return this._parse;
    }

    get progress(): Progress {
        return this._progress;
    }

    get suggestions(): Suggestion[] {
        return this._suggestions;
    }

    withSuggestions(suggestions: Suggestion[]): Result {
        return new Result(
            this.parse,
            this.progress,
            suggestions
        );
    }

    withParse(parse: Token[]): Result {
        return new Result(
            parse,
            this.progress,
            this.suggestions
        );
    }
}

// FIXME: remove "| undefined".
function getProgress(inputToken: Token | undefined, expectedValue: string) {
    if (!inputToken) {
        return Progress.OnStart;
    }

    if (expectedValue.length === 0) {
        return Progress.Finished;
    }

    const inputValue = inputToken.value;
    const normalizedExpectedValue = inputValue === inputValue.toLowerCase() ? expectedValue.toLowerCase() : expectedValue;

    if (inputToken.isComplete) {
        return inputValue === normalizedExpectedValue ? Progress.Finished : Progress.Failed;
    }

    if (inputValue.length === 0) {
        return Progress.OnStart;
    }

    if (normalizedExpectedValue.length < inputValue.length) {
        return Progress.Failed;
    }

    if (inputValue.startsWith(normalizedExpectedValue)) {
        return Progress.Finished;
    }

    if (normalizedExpectedValue.startsWith(inputValue)) {
        return Progress.InProgress;
    }

    return Progress.Failed;
}

export const string = (expected: string) => {
    return async (context: Context): Promise<Array<Result>> => {
        const token = context.input[0];
        const progress = getProgress(context.input[0], expected);

        let suggestions: Suggestion[] = [];

        switch (progress) {
            case Progress.Finished:
                if (!token.isComplete) {
                    suggestions.push(new Suggestion().withDisplayValue(expected).withValue(""));
                }
                break;
            case Progress.OnStart:
            case Progress.InProgress:
                suggestions.push(new Suggestion().withValue(expected));
                break;
            default:
                break;
        }

        return [new Result(
            progress === Progress.Finished ? context.input.slice(0, 1) : [],
            progress,
            suggestions
        )];
    };
};

export const bind = (left: Parser, rightGenerator: (result: Result) => Promise<Parser>) => async (context: Context): Promise<Array<Result>> => {
    const results: Result[] = [];

    const leftResults = await left(context);

    for (const leftResult of leftResults) {
        const rightInput = context.input.slice(leftResult.parse.length);

        switch (leftResult.progress) {
            case Progress.Failed:
                break;
            case Progress.Finished:
                if (_.last(leftResult.parse).isComplete) {
                    const right = await rightGenerator(leftResult);
                    const rightResults = await right(context.withInput(rightInput));

                    for (const rightResult of rightResults) {
                        if (rightResult.progress !== Progress.Failed) {
                            results.push(new Result(
                                concatTokens(leftResult.parse, rightResult.parse),
                                rightResult.progress === Progress.OnStart ? Progress.InProgress : rightResult.progress,
                                rightResult.suggestions
                            ));
                        }
                    }
                } else {
                    results.push(leftResult);
                }

                break;
            default:
                results.push(leftResult);
                break;
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

const shortCircuitOnEmptyInput = (parser: Parser): Parser => async(context: Context): Promise<Array<Result>> => {
    if (context.input.length === 0) {
        return [];
    }

    return parser(context);
};

export const many1 = (parser: Parser): Parser => choice([parser, bind(parser, async () => many1(parser))]);

export const decorate = (parser: Parser, decorator: (s: Suggestion) => Suggestion) => async (context: Context): Promise<Array<Result>> => {
    const results = await parser(context);

    return results.map(result => result.withSuggestions(result.suggestions.map(decorator)));
};

export const decorateResult = (parser: Parser, decorator: (c: Result) => Result) => async (context: Context): Promise<Array<Result>> => {
    return (await parser(context)).map(decorator);
};

export const withoutSuggestions = (parser: Parser) => decorateResult(parser, result => result.withSuggestions([]));
export const optional = (parser: Parser) => choice([withoutSuggestions(string("")), parser]);

/**
 * Display suggestions only if a person has already input at least one character of the expected value.
 * Used to display easy and popular suggestions, which would add noise to the autocompletion box.
 *
 * @example cd ../
 * @example cd -
 */
export const noisySuggestions = (parser: Parser) => shortCircuitOnEmptyInput(decorateResult(
    parser,
    result => result.withSuggestions((result.progress !== Progress.OnStart && result.progress !== Progress.Failed) ? result.suggestions : [])
));

export const runtime = (producer: (context: Context) => Promise<Parser>) => async (context: Context): Promise<Array<Result>> => {
    const parser = await producer(context);
    return parser(context);
};

export const optionalContinuation = (parser: Parser) => optional(parser);
export const token = (parser: Parser) => decorate(parser, suggestion => suggestion.withValue(suggestion.value + " "));
export const executable = (name: string) => decorate(token(string(name)), style(styles.executable));
export const commandSwitch = (value: string) => decorate(string(`--${value}`), style(styles.option));
export const option = (value: string) => decorate(string(`--${value}=`), style(styles.option));
