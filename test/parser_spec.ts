import {expect} from "chai";
import {string, choice, many1, optional, sequence} from "../src/Parser.ts";
// import {Suggestion} from "../src/plugins/autocompletion_providers/Suggestions";

const context = {
    directory: "/",
};
// const valuesOf = (suggestions: Suggestion[]) => suggestions.map(suggestion => suggestion.value);

describe("parser", () => {
    // it("returns suggestions", async() => {
    //     const result = await string("git")
    //         .sequence(string(" "))
    //         .sequence(choice([string("commit"), string("checkout"), string("merge")]))
    //         .parse("git c", context);
    //     const suggestions = await result.parser.suggestions(context);
    //
    //     expect(valuesOf(suggestions)).to.eql(["commit", "checkout"]);
    // });

    describe("sequence", () => {
        describe("git commit", () => {
            const git = string("git ");
            const commit = string("commit");
            const parser = sequence(git, commit);

            it("derives the first parser for no input", async() => {
                const results = await parser("", context);

                expect(results.length).to.equal(1);
                expect(results[0].parser).to.equal(git);
            });

            it("derives the first parser for a part of first parsers' input", async() => {
                const results = await parser("gi", context);

                expect(results.length).to.equal(1);
                expect(results[0].parser).to.equal(git);
            });

            it("derives the first parser if the input exactly matches the first parser", async() => {
                const results = await parser("git ", context);

                expect(results.length).to.equal(1);
                expect(results[0].parser).to.equal(git);
            });

            it("derives the second parser if the input exceeds the first parser", async() => {
                const results = await parser("git c", context);

                expect(results.length).to.equal(1);
                expect(results[0].parser).to.equal(commit);
            });
        });

        describe("chaining", () => {
            const commit = string("commit");
            const git = string("git");
            const space = string(" ");

            it("derives when chained to the left", async() => {
                const parser = sequence(sequence(git, space), commit);
                const results = await parser("git ", context);

                expect(results.length).to.equal(1);
                expect(results[0]).to.deep.include({
                    parser: space,
                    parse: "git ",
                });
            });

            it("derives when chained to the right", async() => {
                const parser = sequence(git, sequence(space, commit));
                const results = await parser("git ", context);

                expect(results.length).to.equal(1);
                expect(results[0]).to.deep.include({
                    parser: space,
                    parse: "git ",
                });
            });
        });
    });

    describe("string", () => {
        it("fails when only beginnings match", async() => {
            const parser = string("grep");
            const results = await parser("git c", context);

            expect(results.length).to.equal(1);
            expect(results[0].parser).to.equal(parser);
        });
    });

    describe("choice", () => {
        it("derives the left parser if the right one doesn't match", async() => {
            const left = string("foo");
            const right = string("bar");

            const results = await choice([left, right])("f", context);

            expect(results.length).to.equal(1);
            expect(results[0].parser).to.equal(left);
        });

        it("derives the right parser if the left one doesn't match", async() => {
            const left = string("foo");
            const right = string("bar");

            const results = await choice([left, right])("b", context);

            expect(results.length).to.equal(1);
            expect(results[0].parser).to.equal(right);
        });

        it("derives both parsers if they match", async() => {
            const soon = string("soon");
            const sooner = string("sooner");

            const results = await choice([soon, sooner])("soo", context);

            expect(results.length).to.equal(2);
            expect(results.map(result => result.parser)).to.eql([soon, sooner]);
        });

        it("doesn't commit to a branch too early", async() => {
            const commit = string("commit");
            const results = await sequence(sequence(string("git"), choice([string(" "), string("  ")])), commit)("git  commit", context);

            expect(results.length).to.equal(1);
            expect(results[0].parser).to.equal(commit);
        });
    });

    describe("many1", () => {
        const commit = string("commit");
        const parser = sequence(sequence(string("git"), many1(string(" "))), commit);

        it("matches one occurrence", async() => {
            const results = await parser("git c", context);

            expect(results.length).to.equal(1);
            expect(results[0].parser).to.equal(commit);
        });

        it("matches two occurrences", async() => {
            const results = await parser("git  c", context);

            expect(results.length).to.equal(1);
            expect(results[0].parser).to.equal(commit);
        });
    });

    describe("optional", () => {
        it("matches no occurrence", async() => {
            const git = string("git");
            const results = await sequence(optional(string("sudo ")), git)("g", context);

            expect(results.length).to.equal(1);
            expect(results[0].parser).to.equal(git);
        });

        it("matches with an occurrence", async() => {
            const git = string("git");
            const results = await sequence(optional(string("sudo ")), git)("sudo g", context);

            expect(results.length).to.equal(1);
            expect(results[0].parser).to.equal(git);
        });
    });
});
