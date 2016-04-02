import {expect} from "chai";
import {item, sat, plus, pplus, char} from "../src/Parser";

describe("parser", () => {
    describe("item", () => {
        it("parses the first character", async () => {
            const result = await item("hello");

            expect(result.length).to.eql(1);
            expect(result[0]).to.eql({ parse: "h", rest: "ello" });
        });

        it("fails with an empty string", async () => {
            const result = await item("");

            expect(result.length).to.eql(0);
        });
    });

    describe("sat", () => {
        context("predicate matches", () => {
            it("parses the first character", async () => {
                const result = await sat(c => c === "h")("hello");

                expect(result.length).to.eql(1);
                expect(result[0]).to.eql({ parse: "h", rest: "ello" });
            });
        });

        context("predicate doesn't match", () => {
            it("parses the first character", async () => {
                const result = await sat(c => c === "H")("hello");

                expect(result.length).to.eql(0);
            });
        });
    });

    describe("char", () => {
        context("matches", () => {
            it("parses the first character", async () => {
                const result = await char("h")("hello");

                expect(result.length).to.eql(1);
                expect(result[0]).to.eql({ parse: "h", rest: "ello" });
            });
        });

        context("doesn't match", () => {
            it("returns an empty array", async () => {
                const result = await char("H")("hello");

                expect(result.length).to.eql(0);
            });
        });
    });

    describe("plus", () => {
        it("returns results of both parsers", async () => {
            const result = await plus(item, item)("hello");

            expect(result.length).to.eql(2);
            expect(result[0]).to.eql({ parse: "h", rest: "ello" });
            expect(result[1]).to.eql({ parse: "h", rest: "ello" });
        });
    });

    describe("pplus", () => {
        context("the first parser doesn't match", () => {
            it("returns the first result", async () => {
                const result = await pplus(char("k"), item)("hello");

                expect(result.length).to.eql(1);
                expect(result[0]).to.eql({ parse: "h", rest: "ello" });
            });
        });

        context("the second parser doesn't match", () => {
            it("returns the first result", async () => {
                const result = await pplus(item, char("k"))("hello");

                expect(result.length).to.eql(1);
                expect(result[0]).to.eql({ parse: "h", rest: "ello" });
            });
        });

        context("both parsers match", () => {
            it("returns the first result", async () => {
                const result = await pplus(item, item)("hello");

                expect(result.length).to.eql(1);
                expect(result[0]).to.eql({ parse: "h", rest: "ello" });
            });
        });

        context("neither parser matches", () => {
            it("returns an empty array", async () => {
                const result = await pplus(char("k"), char("k"))("hello");

                expect(result.length).to.eql(0);
            });
        });
    });
});
