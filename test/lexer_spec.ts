import {expect} from "chai";
import {lex} from "../src/CommandExpander";

describe("lex", () => {
    it("splits on a space", () => {
        expect(lex("some words")).to.eql(["some", "words"]);
    });

    it("doesn't split inside double quotes", () => {
        expect(lex('prefix "inside quotes"')).to.eql(["prefix", "inside quotes"]);
    });

    it("doesn't split inside single quotes", () => {
        expect(lex("prefix 'inside quotes'")).to.eql(["prefix", "inside quotes"]);
    });

    it("doesn't split on an escaped space", () => {
        expect(lex("prefix single\\ token")).to.eql(["prefix", "single token"]);
    });
});
