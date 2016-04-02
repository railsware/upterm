type Result<A> = {parse: A, rest: string};
type Results<A> = Promise<Array<Result<A>>>;

interface IParser<A> {
    (cs: string): Results<A>;
}

function concat<A>(nestedArray: A[][]): A[] {
    const resultingArray: A[] = [];

    for (let innerArray of nestedArray) {
        for (let element of innerArray) {
            resultingArray.push(element);
        }
    }

    return resultingArray;
}

function bind<A, B>(p: IParser<A>, f: (f: A) => IParser<B>): IParser<B> {
    return async (cs: string) => {
        const results: Array<Result<A>> = await p(cs);
        const secondParserResults: Result<B>[][] = await Promise.all(results.map((result: Result<A>) => f(result.parse)(result.rest)));
        return concat(secondParserResults);
    };
}

export async function item(cs: string): Results<string> {
    if (cs.length) {
        return [{ parse: cs[0], rest: cs.substr(1)}];
    } else {
        return [];
    }
}

export function unit<A>(a: A): IParser<A> {
    return async (cs) => [{parse: a, rest: cs}];
}

export function zero<A>(): IParser<A> {
    return async (cs: string) => [];
}

export const sat = (predicate: (v: string) => boolean): IParser<string> =>
    bind(item, x => predicate(x) ? unit(x) : zero<string>());

export const char = (x: string) => sat(y => y === x);

export const str = (stringToMatch: string): IParser<string> =>
    stringToMatch.length ?
        bind(char(stringToMatch[0]), c => bind(str(stringToMatch.substr(1)), cs => unit(c + cs))) :
        unit("");

export function plus<A>(p: IParser<A>, q: IParser<A>): IParser<A> {
    return async (cs: string) => (await p(cs)).concat(await q(cs));
}

export function pplus<A>(p: IParser<A>, q: IParser<A>): IParser<A> {
    return async (cs: string) => {
        const results = await plus<A>(p, q)(cs);
        return results.length ? [results[0]] : [];
    };
}

export const seq = <A, B>(p: IParser<A>, q: IParser<B>): IParser<[A, B]> =>
    bind(p, x => bind(q, y => unit<[A, B]>([x, y])));

export const digit = sat(x => x >= "0" && x <= "9");
export const lower = sat(x => x >= "a" && x <= "z");
export const upper = sat(x => x >= "A" && x <= "Z");

export const letter = plus(lower, upper);
export const alphanum = plus(letter, digit);

export const word: IParser<string> = plus(bind(letter, x => bind(word, xs => unit(x + xs))), unit(""));
export const many1 = <A>(p: IParser<A>): IParser<A[]> => bind(p, x => bind(many(p), xs => unit([x].concat(xs))));
export const many = <A>(p: IParser<A>): IParser<A[]> => pplus(many1(p), unit([]));

export const ident = bind(lower, x => bind(many(alphanum), xs => unit(x + xs)));

export const nat: IParser<number> = bind(many1(digit), xs => unit(parseFloat(xs.join(""))));

export const sepby1 = <A, B>(p: IParser<A>, sep: IParser<B>): IParser<A[]> =>
    bind(p, x => bind(many(bind(sep, _ => p)), xs => unit([x].concat(xs))));

export const sepby = <A, B>(p: IParser<A>, sep: IParser<B>): IParser<A[]> => pplus(sepby1(p, sep), unit([]));

export const chainl1 = <A>(p: IParser<A>, op: IParser<(a: A) => (b: A) => A>): IParser<A> => {
    const rest = (x: A): IParser<A> => pplus(bind(op, f => bind(p, y => rest(f(x)(y)))), unit(x));
    return bind(p, rest);
};

export const chainl = <A>(p: IParser<A>, op: IParser<(a: A) => (b: A) => A>, a: A): IParser<A> => pplus(chainl1(p, op), unit(a));

export const int = plus(bind(char("-"), _ => bind(nat, n => unit(-n))), nat);
export const ints = bind(char("["), _ => bind(sepby1(int, char(",")), ns => bind(char("]"), _ => unit(ns))));

export const bracket = <A, B>(open: IParser<B>, p: IParser<A>, close: IParser<B>): IParser<A> => bind(open, _ => bind(p, x => bind(close, _ => unit(x))));
export const intsv2 = bracket(char("["), sepby1(int, char(",")), (char("]")));

export const space = many(char(" "));
export const token = <A>(p: IParser<A>): IParser<A> => bind(p, a => bind(space, _ => unit(a)));
export const symbol = (cs: string): IParser<string> => token(str(cs));
export const apply = <A>(p: IParser<A>, cs: string): Results<A> => bind(space, _ => p)(cs);

export const numericDigit: IParser<number> = bind(token(digit), x => unit(parseInt(x, 10)));
export const addop: IParser<(a: number) => (b: number) => number> = pplus(
    bind(symbol("+"), _ => unit(add)),
    bind(symbol("-"), _ => unit(subtract))
);
export const mulop: IParser<(a: number) => (b: number) => number> = pplus(
    bind(symbol("*"), _ => unit(multiply)),
    bind(symbol("/"), _ => unit(divide))
);
export const factor: IParser<number> = pplus(
    numericDigit,
    bind(symbol("("), _ => bind(expr, n => bind(symbol(")"), _ => unit(n))))
);
export const term: IParser<number> = chainl1(factor, mulop);
export const expr: IParser<number> = chainl1(term, addop);

function add(a: number) {
    return (b: number) => a + b;
}

function subtract(a: number) {
    return (b: number) => a - b;
}

function multiply(a: number) {
    return (b: number) => a * b;
}

function divide(a: number) {
    return (b: number) => a / b;
}
