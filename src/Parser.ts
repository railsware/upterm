type Result<A> = {parse: A, rest: string};
type Results<A> = Promise<Array<Result<A>>>;

interface Parser<A> {
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

function bind<A, B>(p: Parser<A>, f: (f: A) => Parser<B>): Parser<B> {
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

export function unit<A>(a: A): Parser<A> {
    return async (cs) => [{parse: a, rest: cs}];
}

export function zero<A>(): Parser<A> {
    return async (cs: string) => [];
}

export const sat = (predicate: (v: string) => boolean): Parser<string> =>
    bind(item, x => predicate(x) ? unit(x) : zero<string>());

export const char = (x: string) => sat(y => y === x);

export const str = (stringToMatch: string): Parser<string> =>
    stringToMatch.length ?
        bind(char(stringToMatch[0]), c => bind(str(stringToMatch.substr(1)), cs => unit(c + cs))) :
        unit("");

export function plus<A>(p: Parser<A>, q: Parser<A>): Parser<A> {
    return async (cs: string) => (await p(cs)).concat(await q(cs));
}

export function pplus<A>(p: Parser<A>, q: Parser<A>): Parser<A> {
    return async (cs: string) => {
        const results = await plus<A>(p, q)(cs);
        return results.length ? [results[0]] : [];
    };
}

export const seq = <A, B>(p: Parser<A>, q: Parser<B>): Parser<[A, B]> =>
    bind(p, x => bind(q, y => unit<[A, B]>([x, y])));

export const digit = sat(x => x >= "0" && x <= "9");
export const lower = sat(x => x >= "a" && x <= "z");
export const upper = sat(x => x >= "A" && x <= "Z");

export const letter = plus(lower, upper);
export const alphanum = plus(letter, digit);

export const word: Parser<string> = plus(bind(letter, x => bind(word, xs => unit(x + xs))), unit(""));
export const many1 = <A>(p: Parser<A>): Parser<A[]> => bind(p, x => bind(many(p), xs => unit([x].concat(xs))));
export const many = <A>(p: Parser<A>): Parser<A[]> => pplus(many1(p), unit([]));

export const ident = bind(lower, x => bind(many(alphanum), xs => unit(x + xs)));

export const nat: Parser<number> = bind(many1(digit), xs => unit(parseFloat(xs.join(""))));

export const sepby1 = <A, B>(p: Parser<A>, sep: Parser<B>): Parser<A[]> =>
    bind(p, x => bind(many(bind(sep, _ => p)), xs => unit([x].concat(xs))));

export const sepby = <A, B>(p: Parser<A>, sep: Parser<B>): Parser<A[]> => pplus(sepby1(p, sep), unit([]));

export const chainl1 = <A>(p: Parser<A>, op: Parser<(a: A) => (b: A) => A>): Parser<A> => {
    const rest = (x: A): Parser<A> => pplus(bind(op, f => bind(p, y => rest(f(x)(y)))), unit(x));
    return bind(p, rest);
};

export const chainl = <A>(p: Parser<A>, op: Parser<(a: A) => (b: A) => A>, a: A): Parser<A> => pplus(chainl1(p, op), unit(a));

export const int = plus(bind(char("-"), _ => bind(nat, n => unit(-n))), nat);
export const ints = bind(char("["), _ => bind(sepby1(int, char(",")), ns => bind(char("]"), _ => unit(ns))));

export const bracket = <A, B>(open: Parser<B>, p: Parser<A>, close: Parser<B>): Parser<A> => bind(open, _ => bind(p, x => bind(close, _ => unit(x))));
export const intsv2 = bracket(char("["), sepby1(int, char(",")), (char("]")));

export const space = many(char(" "));
export const token = <A>(p: Parser<A>): Parser<A> => bind(p, a => bind(space, _ => unit(a)));
export const symbol = (cs: string): Parser<string> => token(str(cs));
export const apply = <A>(p: Parser<A>, cs: string): Results<A> => bind(space, _ => p)(cs);

export const numericDigit: Parser<number> = bind(token(digit), x => unit(parseInt(x, 10)));
export const addop: Parser<(a: number) => (b: number) => number> = pplus(
    bind(symbol("+"), _ => unit(add)),
    bind(symbol("-"), _ => unit(subtract))
);
export const mulop: Parser<(a: number) => (b: number) => number> = pplus(
    bind(symbol("*"), _ => unit(multiply)),
    bind(symbol("/"), _ => unit(divide))
);
export const factor: Parser<number> = pplus(
    numericDigit,
    bind(symbol("("), _ => bind(expr, n => bind(symbol(")"), _ => unit(n))))
);
export const term: Parser<number> = chainl1(factor, mulop);
export const expr: Parser<number> = chainl1(term, addop);

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
