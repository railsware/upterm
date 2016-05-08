import {expect} from "chai";
import {string, choice, many1, optional, sequence, Parser} from "../src/Parser.ts";

async function parse(parser: Parser, input: string) {
    return await parser({input: input, directory: "/", historicalCurrentDirectoriesStack: []});
}

describe("parser", () => {
    describe("sequence", () => {
        describe("git commit", () => {
            const git = string("git ");
            const commit = string("commit");
            const parser = sequence(git, commit);

            it("derives the first parser for no input", async() => {
                const results = await parse(parser, "");

                expect(results.length).to.equal(1);
                expect(results[0].parser).to.equal(git);
            });

            it("derives the first parser for a part of first parsers' input", async() => {
                const results = await parse(parser, "gi");

                expect(results.length).to.equal(1);
                expect(results[0].parser).to.equal(git);
            });

            it("derives the first parser if the input exactly matches the first parser", async() => {
                const results = await parse(parser, "git ");

                expect(results.length).to.equal(1);
                expect(results[0].parser).to.equal(git);
            });

            it("derives the second parser if the input exceeds the first parser", async() => {
                const results = await parse(parser, "git c");

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
                const results = await parse(parser, "git ");

                expect(results.length).to.equal(1);
                expect(results[0]).to.deep.include({
                    parser: space,
                    parse: "git ",
                });
            });

            it("derives when chained to the right", async() => {
                const parser = sequence(git, sequence(space, commit));
                const results = await parse(parser, "git ");

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
            const results = await parse(parser, "git c");

            expect(results.length).to.equal(1);
            expect(results[0].parser).to.equal(parser);
        });
    });

    describe("choice", () => {
        it("derives the left parser if the right one doesn't match", async() => {
            const left = string("foo");
            const right = string("bar");

            const results = await parse(choice([left, right]), "f");

            expect(results.length).to.equal(1);
            expect(results[0].parser).to.equal(left);
        });

        it("derives the right parser if the left one doesn't match", async() => {
            const left = string("foo");
            const right = string("bar");

            const results = await parse(choice([left, right]), "b");

            expect(results.length).to.equal(1);
            expect(results[0].parser).to.equal(right);
        });

        it("derives both parsers if they match", async() => {
            const soon = string("soon");
            const sooner = string("sooner");

            const results = await parse(choice([soon, sooner]), "soo");

            expect(results.length).to.equal(2);
            expect(results.map(result => result.parser)).to.eql([soon, sooner]);
        });

        it("doesn't commit to a branch too early", async() => {
            const commit = string("commit");
            const results = await parse(sequence(sequence(string("git"), choice([string(" "), string("  ")])), commit), "git  commit");

            expect(results.length).to.equal(1);
            expect(results[0].parser).to.equal(commit);
        });
    });

    describe("many1", () => {
        const commit = string("commit");
        const parser = sequence(sequence(string("git"), many1(string(" "))), commit);

        it("matches one occurrence", async() => {
            const results = await parse(parser, "git c");

            expect(results.length).to.equal(1);
            expect(results[0].parser).to.equal(commit);
        });

        it("matches two occurrences", async() => {
            const results = await parse(parser, "git  c");

            expect(results.length).to.equal(1);
            expect(results[0].parser).to.equal(commit);
        });
    });

    describe("optional", () => {
        it("matches no occurrence", async() => {
            const git = string("git");
            const results = await parse(sequence(optional(string("sudo ")), git), "g");

            expect(results.length).to.equal(1);
            expect(results[0].parser).to.equal(git);
        });

        it("matches with an occurrence", async() => {
            const git = string("git");
            const results = await parse(sequence(optional(string("sudo ")), git), "sudo g");

            expect(results.length).to.equal(1);
            expect(results[0].parser).to.equal(git);
        });
    });
});
