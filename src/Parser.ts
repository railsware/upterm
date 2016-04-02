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

// export const word: IParser<string> = plus(bind(letter, x => bind(word, xs => unit(x + xs))), unit(""));
// export const many1 = <A>(p: Parser<A>): Parser<A[]> => p.bind(x => many(p).bind(xs => unit([x].concat(xs))));
// export const many = <A>(p: Parser<A>): Parser<A[]> => pplus(many1(p), unit([]));
//
// export const ident = lower.bind(x => many(alphanum).bind(xs => unit(x + xs)));
// export const nat: Parser<number> = many1(digit).bind(xs => unit(parseFloat(xs.join(""))));
//
// export const sepby1 = <A, B>(p: Parser<A>, sep: Parser<B>): Parser<A[]> =>
//     p.bind(x => many(sep.bind(_ => p)).bind(xs => unit([x].concat(xs))));

// export const sepby = (p, sep) => pplus(sepby1(p, sep), unit([]));
//
// export const chainl1 = <A>(p: Parser<A>, op: Parser<(a: A) => (b: A) => A>): Parser<A> => {
//     const rest = (x: A): Parser<A> => pplus(op.bind(f => p.bind(y => rest(f(x)(y)))), unit(x));
//     return p.bind(rest);
// };
//
// export const chainl = (p, op, a) => pplus(chainl1(p, op), unit(a));
//
// export const int = plus(char("-").bind(_ => nat.bind(n => unit(-n))), nat);
// export const ints = char("[").bind(_ => sepby1(int, char(",")).bind(ns => char("]").bind(_ => unit(ns))));
// export const bracket = (open, p, close) => open.bind(_ => p.bind(x => close.bind(_ => unit(x))));
// export const intsv2 = bracket(char("["), sepby1(int, char(",")), (char("]")));
//
// export const space = many(sat(x => x === " "));
// export const token = <A>(p: Parser<A>): Parser<A> => p.bind(a => space.bind(_ => unit(a)));
// export const symb = (cs: string): Parser<string> => token(str(cs));
// export const apply = <A>(p: Parser<A>, cs: string): [A, string][] => space.bind(_ => p)(cs);
//
// export let expr: Parser<number>;
// export let addop: Parser<(a: number) => (b: number) => number>;
// export let mulop: Parser<(a: number) => (b: number) => number>;
// export let term: Parser<number>;
// export let factor: Parser<number>;
// export let numericDigit: Parser<number>;
//
// addop = pplus(
//     symb("+").bind(_ => unit(a => b => a + b)),
//     symb("-").bind(_ => unit(a => b => a - b))
// );
//
// mulop = pplus(
//     symb("*").bind(_ => unit(a => b => a * b)),
//     symb("/").bind(_ => unit(a => b => a / b))
// );
//
// numericDigit = token(digit).bind(x => unit(parseInt(x, 10)));
//
// factor = pplus(
//     numericDigit,
//     symb("(").bind(_ => expr.bind(n => symb(")").bind(_ => unit(n))))
// );
//
// term = chainl1(factor, mulop);
// expr = chainl1(term, addop);
