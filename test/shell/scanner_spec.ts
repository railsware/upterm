import {expect} from "chai";
import {
    scan, Word, DoubleQuotedStringLiteral, SingleQuotedStringLiteral,
    Pipe, OutputRedirectionSymbol, AppendingOutputRedirectionSymbol, InputRedirectionSymbol, Invalid, Semicolon,
} from "../../src/shell/Scanner";

describe("scan", () => {
    it("returns no tokens on empty input", () => {
        const tokens = scan("");

        expect(tokens.length).to.eq(0);
    });

    it("returns an invalid token on input that consists only of spaces", () => {
        const tokens = scan("  ");

        expect(tokens.length).to.eq(1);
        expect(tokens[0]).to.be.an.instanceof(Invalid);
    });

    it("splits on a space", () => {
        const tokens = scan("some words");

        expect(tokens.length).to.eq(2);
        expect(tokens[0]).to.be.an.instanceof(Word);
        expect(tokens[1]).to.be.an.instanceof(Word);

        expect(tokens.map(token => token.value)).to.eql(["some", "words"]);
    });

    it("doesn't split inside double quotes", () => {
        const tokens = scan('prefix "inside quotes"');

        expect(tokens.length).to.eq(2);
        expect(tokens[0]).to.be.an.instanceof(Word);
        expect(tokens[1]).to.be.an.instanceof(DoubleQuotedStringLiteral);

        expect(tokens.map(token => token.value)).to.eql(["prefix", "inside quotes"]);
    });

    it("doesn't split inside single quotes", () => {
        const tokens = scan("prefix 'inside quotes'");

        expect(tokens.length).to.eq(2);
        expect(tokens[0]).to.be.an.instanceof(Word);
        expect(tokens[1]).to.be.an.instanceof(SingleQuotedStringLiteral);

        expect(tokens.map(token => token.value)).to.eql(["prefix", "inside quotes"]);
    });

    it("doesn't split on an escaped space", () => {
        const tokens = scan("prefix single\\ token");

        expect(tokens.length).to.eq(2);
        expect(tokens[0]).to.be.an.instanceof(Word);
        expect(tokens[1]).to.be.an.instanceof(Word);

        expect(tokens.map(token => token.value)).to.eql(["prefix", "single token"]);
    });

    it("doesn't split on a colon", () => {
        const tokens = scan("curl http://www.example.com");

        expect(tokens.length).to.eq(2);
        expect(tokens[0]).to.be.an.instanceof(Word);
        expect(tokens[1]).to.be.an.instanceof(Word);

        expect(tokens.map(token => token.value)).to.eql(["curl", "http://www.example.com"]);
    });

    it("can handle special characters", () => {
        const tokens = scan("ls --color=tty -lh");

        expect(tokens.length).to.eq(3);
        expect(tokens[0]).to.be.an.instanceof(Word);
        expect(tokens[1]).to.be.an.instanceof(Word);
        expect(tokens[2]).to.be.an.instanceof(Word);

        expect(tokens.map(token => token.value)).to.eql(["ls", "--color=tty", "-lh"]);
    });

    it("recognizes a pipe", () => {
        const tokens = scan("cat file | grep word");

        expect(tokens.length).to.eq(5);
        expect(tokens[0]).to.be.an.instanceof(Word);
        expect(tokens[1]).to.be.an.instanceof(Word);
        expect(tokens[2]).to.be.an.instanceof(Pipe);
        expect(tokens[3]).to.be.an.instanceof(Word);
        expect(tokens[4]).to.be.an.instanceof(Word);

        expect(tokens.map(token => token.value)).to.eql(["cat", "file", "|", "grep", "word"]);
    });

    it("recognizes a semicolon", () => {
        const tokens = scan("cd directory; rm file");

        expect(tokens.length).to.eq(5);
        expect(tokens[0]).to.be.an.instanceof(Word);
        expect(tokens[1]).to.be.an.instanceof(Word);
        expect(tokens[2]).to.be.an.instanceof(Semicolon);
        expect(tokens[3]).to.be.an.instanceof(Word);
        expect(tokens[4]).to.be.an.instanceof(Word);

        expect(tokens.map(token => token.value)).to.eql(["cd", "directory", ";", "rm", "file"]);
    });

    it("recognizes input redirection", () => {
        const tokens = scan("cat < file");

        expect(tokens.length).to.eq(3);
        expect(tokens[0]).to.be.an.instanceof(Word);
        expect(tokens[1]).to.be.an.instanceof(InputRedirectionSymbol);
        expect(tokens[2]).to.be.an.instanceof(Word);

        expect(tokens.map(token => token.value)).to.eql(["cat", "<", "file"]);
    });

    it("recognizes output redirection", () => {
        const tokens = scan("cat file > another_file");

        expect(tokens.length).to.eq(4);
        expect(tokens[0]).to.be.an.instanceof(Word);
        expect(tokens[1]).to.be.an.instanceof(Word);
        expect(tokens[2]).to.be.an.instanceof(OutputRedirectionSymbol);
        expect(tokens[3]).to.be.an.instanceof(Word);

        expect(tokens.map(token => token.value)).to.eql(["cat", "file", ">", "another_file"]);
    });

    it("recognizes appending output redirection", () => {
        const tokens = scan("cat file >> another_file");

        expect(tokens.length).to.eq(4);
        expect(tokens[0]).to.be.an.instanceof(Word);
        expect(tokens[1]).to.be.an.instanceof(Word);
        expect(tokens[2]).to.be.an.instanceof(AppendingOutputRedirectionSymbol);
        expect(tokens[3]).to.be.an.instanceof(Word);

        expect(tokens.map(token => token.value)).to.eql(["cat", "file", ">>", "another_file"]);
    });

    it("can handle unicode é", () => {
        const tokens = scan("cd é/");
        expect(tokens.map(token => token.value)).to.eql(["cd", "é/"]);
    });

    it("can handle 'x+' (regression test for #753)", () => {
        const tokens = scan("cd x+");
        expect(tokens.map(token => token.value)).to.eql(["cd", "x+"]);
    });

    it("includes spaces at end in final token", () => {
        const tokens = scan("test space ");
        expect(tokens.map(token => token.value)).to.eql(["test", "space"]);
    });

    it("handles escaped brackets in words", () => {
        const tokens = scan("file\\ with\\ brackets\\(\\)");
        expect(tokens.map(token => token.value)).to.eql(["file with brackets\\(\\)"]);
    });

    it("adds an invalid token on invalid input", () => {
        const tokens = scan("cd '");
        expect(tokens.length).to.eq(2);
        expect(tokens[0]).to.be.an.instanceof(Word);
        expect(tokens[1]).to.be.an.instanceof(Invalid);
        expect(tokens.map(token => token.value)).to.eql(["cd", "'"]);
    });
});
