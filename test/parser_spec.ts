import {expect} from "chai";
import * as _ from "lodash";
import {
    string, choice, many1, optional, sequence, Parser, Progress, token,
    noisySuggestions, Context,
} from "../src/Parser.ts";
import {suggestionDisplayValues} from "./helpers";
import {Environment} from "../src/Environment";
import {OrderedSet} from "../src/utils/OrderedSet";
import {scan} from "../src/shell/Scanner";

async function parse(parser: Parser, input: string) {
    return await parser(new Context(
        scan(input),
        "/",
        new OrderedSet<string>(),
        new Environment({})
    ));
}

describe.only("parser", () => {
    describe("sequence", () => {
        describe("git commit", () => {
            const git = string("git");
            const commit = string("commit");
            const parser = sequence(git, commit);

            it("derives the first parser for no input", async() => {
                const results = await parse(parser, "");

                expect(suggestionDisplayValues(results)).to.eql(["git"]);
            });

            it("derives the first parser for a part of first parsers' input", async() => {
                const results = await parse(parser, "gi");

                expect(suggestionDisplayValues(results)).to.eql(["git"]);
            });

            it("derives the first parser if the input exactly matches the first parser", async() => {
                const results = await parse(parser, "git");

                expect(suggestionDisplayValues(results)).to.eql(["git"]);
            });

            it("derives the second parser if the input exceeds the first parser", async() => {
                const results = await parse(parser, "git c");

                expect(suggestionDisplayValues(results)).to.eql(["commit"]);
            });
        });

        describe("chaining", () => {
            const git = string("git");
            const checkout = string("checkout");
            const master = string("master");

            it("derives when chained to the left", async() => {
                const parser = sequence(sequence(git, checkout), master);
                const results = await parse(parser, "git checkout");

                expect(results.length).to.equal(1);
                expect(results[0].parse.map(token => token.value)).to.eql(["git", "checkout"]);
            });

            it("derives when chained to the right", async() => {
                const parser = sequence(git, sequence(checkout, master));
                const results = await parse(parser, "git checkout");

                expect(results.length).to.equal(1);
                expect(results[0].parse.map(token => token.value)).to.eql(["git", "checkout"]);
            });
        });

        it.skip("isn't finished when parsed only the left part", async() => {
            const spaces = sequence(string("git"), string(" "));
            const results = await parse(spaces, "git");

            expect(_.uniq(results.map(result => result.progress))).to.eql([Progress.InProgress]);
        });

        it.skip("shows the second parser's suggestions right before its start", async() => {
            const spaces = sequence(token(string("git")), string("commit"));
            const results = await parse(spaces, "git ");

            expect(suggestionDisplayValues(results)).to.eql(["commit"]);
        });
    });

    describe("string", () => {
        it("fails when only beginnings match", async() => {
            const parser = string("grep");
            const results = await parse(parser, "git c");

            expect(suggestionDisplayValues(results)).to.eql(["grep"]);
        });
    });

    describe("choice", () => {
        it("derives the left parser if the right one doesn't match", async() => {
            const left = string("foo");
            const right = string("bar");

            const results = await parse(choice([left, right]), "f");

            expect(suggestionDisplayValues(results)).to.eql(["foo"]);
        });

        it("derives the right parser if the left one doesn't match", async() => {
            const left = string("foo");
            const right = string("bar");

            const results = await parse(choice([left, right]), "b");

            expect(suggestionDisplayValues(results)).to.eql(["bar"]);
        });

        it("derives both parsers if they match", async() => {
            const soon = string("soon");
            const sooner = string("sooner");

            const results = await parse(choice([soon, sooner]), "soo");

            expect(suggestionDisplayValues(results)).to.eql(["soon", "sooner"]);
        });

        it("doesn't commit to a branch too early", async() => {
            const commit = string("commit");
            const results = await parse(sequence(sequence(string("cd"), choice([string("/foo"), string("/foo/bar")])), commit), "cd /foo");

            expect(suggestionDisplayValues(results)).to.eql(["/foo", "/foo/bar"]);
        });
    });

    describe.skip("many1", () => {
        const parser = sequence(string("cat"), many1(string("file")));

        it("matches one occurrence", async() => {
            const results = await parse(parser, "cat fi");

            expect(suggestionDisplayValues(results)).to.eql(["file"]);
        });

        it("matches two occurrences", async() => {
            const results = await parse(parser, "cat file fi");

            expect(suggestionDisplayValues(results)).to.eql(["file"]);
        });
    });

    describe("optional", () => {
        const parser = sequence(optional(string("sudo")), string("git"));

        it("matches no occurrence", async() => {
            const results = await parse(parser, "g");

            expect(suggestionDisplayValues(results)).to.eql(["git"]);
        });

        it("matches with an occurrence", async() => {
            const results = await parse(parser, "sudo g");

            expect(suggestionDisplayValues(results)).to.eql(["git"]);
        });
    });


    describe("noisySuggestions", () => {
        const suggestions = async (parser: Parser, input: string) => suggestionDisplayValues(
            await parse(noisySuggestions(parser), input)
        );

        it("doesn't show suggestions on empty input", async() => {
            expect(await suggestions(string("git"), "")).to.eql([]);
        });

        it("shows suggestions in the middle of input", async() => {
            expect(await suggestions(string("git"), "g")).to.eql(["git"]);
        });

        it("shows suggestions at the beginning of a second part of a compound parser", async() => {
            expect(await suggestions(sequence(string("git"), string("commit")), "git ")).to.eql(["commit"]);
        });
    });

    describe("case sensitivity", () => {
        describe("when user types only lowercase letters", () => {
            it("is case insensitive", async() => {
                const results = await parse(sequence(string("./Downloads"), string("/mine")), "./down");

                expect(suggestionDisplayValues(results)).to.eql(["./Downloads"]);
            });
        });

        describe("when user input contains uppercase letters", () => {
            it("is case sensitive", async() => {
                const results = await parse(sequence(string("./documents"), string("/mine")), "./Do");

                expect(results.length).to.equal(0);
            });
        });
    });
});
