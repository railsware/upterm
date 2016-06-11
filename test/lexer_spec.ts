import {expect} from "chai";
import {lex} from "../src/shell/CommandExpander";

describe("lex", () => {
    it("returns an empty array on empty input", () => {
        expect(lex("")).to.eql([]);
    });

    it("splits on a space", () => {
        expect(lex("some words")).to.eql(["some", "words"]);
    });

    it("doesn't split inside double quotes", () => {
        expect(lex('prefix "inside quotes"')).to.eql(["prefix", '"inside quotes"']);
    });

    it("doesn't split inside single quotes", () => {
        expect(lex("prefix 'inside quotes'")).to.eql(["prefix", "'inside quotes'"]);
    });

    it("doesn't split on an escaped space", () => {
        expect(lex("prefix single\\ token")).to.eql(["prefix", "single\\ token"]);
    });

    it("can handle special characters", () => {
        expect(lex("ls --color=tty -lh")).to.eql(["ls", "--color=tty", "-lh"]);
    });
});
