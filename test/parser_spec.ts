import {expect} from "chai";
import * as _ from "lodash";
import {string, choice, many1, optional, sequence, Parser, InputMethod, Progress, token} from "../src/Parser.ts";
import {suggestionDisplayValues} from "./helpers";
import {Environment} from "../src/Environment";
import {OrderedSet} from "../src/utils/OrderedSet";

async function parse(parser: Parser, input: string) {
    return await parser({
        input: input,
        directory: "/",
        historicalCurrentDirectoriesStack: new OrderedSet<string>(),
        environment: new Environment({}),
        inputMethod: InputMethod.Typed,
    });
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
                expect(suggestionDisplayValues(results)).to.eql(["git "]);
            });

            it("derives the first parser for a part of first parsers' input", async() => {
                const results = await parse(parser, "gi");

                expect(results.length).to.equal(1);
                expect(suggestionDisplayValues(results)).to.eql(["git "]);
            });

            it("derives the first parser if the input exactly matches the first parser", async() => {
                const results = await parse(parser, "git ");

                expect(results.length).to.equal(1);
                expect(suggestionDisplayValues(results)).to.eql(["git "]);
            });

            it("derives the second parser if the input exceeds the first parser", async() => {
                const results = await parse(parser, "git c");

                expect(results.length).to.equal(1);
                expect(suggestionDisplayValues(results)).to.eql(["commit"]);
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
                    parse: "git ",
                });
            });

            it("derives when chained to the right", async() => {
                const parser = sequence(git, sequence(space, commit));
                const results = await parse(parser, "git ");

                expect(results.length).to.equal(1);
                expect(results[0]).to.deep.include({
                    parse: "git ",
                });
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

            expect(results.length).to.equal(1);
            expect(suggestionDisplayValues(results)).to.eql(["grep"]);
        });
    });

    describe("choice", () => {
        it("derives the left parser if the right one doesn't match", async() => {
            const left = string("foo");
            const right = string("bar");

            const results = await parse(choice([left, right]), "f");

            expect(results.length).to.equal(1);
            expect(suggestionDisplayValues(results)).to.eql(["foo"]);
        });

        it("derives the right parser if the left one doesn't match", async() => {
            const left = string("foo");
            const right = string("bar");

            const results = await parse(choice([left, right]), "b");

            expect(results.length).to.equal(1);
            expect(suggestionDisplayValues(results)).to.eql(["bar"]);
        });

        it("derives both parsers if they match", async() => {
            const soon = string("soon");
            const sooner = string("sooner");

            const results = await parse(choice([soon, sooner]), "soo");

            expect(results.length).to.equal(2);
            expect(suggestionDisplayValues(results)).to.eql(["soon", "sooner"]);
        });

        it("doesn't commit to a branch too early", async() => {
            const commit = string("commit");
            const results = await parse(sequence(sequence(string("git"), choice([string(" "), string("  ")])), commit), "git  commit");

            expect(results.length).to.equal(1);
            expect(suggestionDisplayValues(results)).to.eql(["commit"]);
        });
    });

    describe("many1", () => {
        const commit = string("commit");
        const parser = sequence(sequence(string("git"), many1(string(" "))), commit);

        it("matches one occurrence", async() => {
            const results = await parse(parser, "git c");

            expect(results.length).to.equal(1);
            expect(suggestionDisplayValues(results)).to.eql(["commit"]);
        });

        it("matches two occurrences", async() => {
            const results = await parse(parser, "git  c");

            expect(results.length).to.equal(1);
            expect(suggestionDisplayValues(results)).to.eql(["commit"]);
        });
    });

    describe("optional", () => {
        it("matches no occurrence", async() => {
            const git = string("git");
            const results = await parse(sequence(optional(string("sudo ")), git), "g");

            expect(results.length).to.equal(1);
            expect(suggestionDisplayValues(results)).to.eql(["git"]);
        });

        it("matches with an occurrence", async() => {
            const git = string("git");
            const results = await parse(sequence(optional(string("sudo ")), git), "sudo g");

            expect(results.length).to.equal(1);
            expect(suggestionDisplayValues(results)).to.eql(["git"]);
        });
    });
});
