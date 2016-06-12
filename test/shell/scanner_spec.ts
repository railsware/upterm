import {expect} from "chai";
import {
    scan, EndOfInput, Word, DoubleQuotedStringLiteral, SingleQuotedStringLiteral,
    Pipe, OutputRedirectionSymbol, AppendingOutputRedirectionSymbol, InputRedirectionSymbol, Invalid,
} from "../../src/shell/Scanner";

describe("scan", () => {
    it("returns end of input on empty input", () => {
        const tokens = scan("");

        expect(tokens.length).to.eq(1);
        expect(tokens[0]).to.be.an.instanceof(EndOfInput);
    });

    it("returns end of input on input that consists only of spaces", () => {
        const tokens = scan("  ");

        expect(tokens.length).to.eq(1);
        expect(tokens[0]).to.be.an.instanceof(EndOfInput);
    });

    it("splits on a space", () => {
        const tokens = scan("some words");

        expect(tokens.length).to.eq(3);
        expect(tokens[0]).to.be.an.instanceof(Word);
        expect(tokens[1]).to.be.an.instanceof(Word);
        expect(tokens[2]).to.be.an.instanceof(EndOfInput);

        expect(tokens.map(token => token.value)).to.eql(["some", "words", ""]);
    });

    it("doesn't split inside double quotes", () => {
        const tokens = scan('prefix "inside quotes"');

        expect(tokens.length).to.eq(3);
        expect(tokens[0]).to.be.an.instanceof(Word);
        expect(tokens[1]).to.be.an.instanceof(DoubleQuotedStringLiteral);
        expect(tokens[2]).to.be.an.instanceof(EndOfInput);

        expect(tokens.map(token => token.value)).to.eql(["prefix", "inside quotes", ""]);
    });

    it("doesn't split inside single quotes", () => {
        const tokens = scan("prefix 'inside quotes'");

        expect(tokens.length).to.eq(3);
        expect(tokens[0]).to.be.an.instanceof(Word);
        expect(tokens[1]).to.be.an.instanceof(SingleQuotedStringLiteral);
        expect(tokens[2]).to.be.an.instanceof(EndOfInput);

        expect(tokens.map(token => token.value)).to.eql(["prefix", "inside quotes", ""]);
    });

    it("doesn't split on an escaped space", () => {
        const tokens = scan("prefix single\\ token");

        expect(tokens.length).to.eq(3);
        expect(tokens[0]).to.be.an.instanceof(Word);
        expect(tokens[1]).to.be.an.instanceof(Word);
        expect(tokens[2]).to.be.an.instanceof(EndOfInput);

        expect(tokens.map(token => token.value)).to.eql(["prefix", "single token", ""]);
    });

    it("can handle special characters", () => {
        const tokens = scan("ls --color=tty -lh");

        expect(tokens.length).to.eq(4);
        expect(tokens[0]).to.be.an.instanceof(Word);
        expect(tokens[1]).to.be.an.instanceof(Word);
        expect(tokens[2]).to.be.an.instanceof(Word);
        expect(tokens[3]).to.be.an.instanceof(EndOfInput);

        expect(tokens.map(token => token.value)).to.eql(["ls", "--color=tty", "-lh", ""]);
    });

    it("recognizes a pipe", () => {
        const tokens = scan("cat file | grep word");

        expect(tokens.length).to.eq(6);
        expect(tokens[0]).to.be.an.instanceof(Word);
        expect(tokens[1]).to.be.an.instanceof(Word);
        expect(tokens[2]).to.be.an.instanceof(Pipe);
        expect(tokens[3]).to.be.an.instanceof(Word);
        expect(tokens[4]).to.be.an.instanceof(Word);
        expect(tokens[5]).to.be.an.instanceof(EndOfInput);

        expect(tokens.map(token => token.value)).to.eql(["cat", "file", "|", "grep", "word", ""]);
    });

    it("recognizes input redirection", () => {
        const tokens = scan("cat < file");

        expect(tokens.length).to.eq(4);
        expect(tokens[0]).to.be.an.instanceof(Word);
        expect(tokens[1]).to.be.an.instanceof(InputRedirectionSymbol);
        expect(tokens[2]).to.be.an.instanceof(Word);
        expect(tokens[3]).to.be.an.instanceof(EndOfInput);

        expect(tokens.map(token => token.value)).to.eql(["cat", "<", "file", ""]);
    });

    it("recognizes output redirection", () => {
        const tokens = scan("cat file > another_file");

        expect(tokens.length).to.eq(5);
        expect(tokens[0]).to.be.an.instanceof(Word);
        expect(tokens[1]).to.be.an.instanceof(Word);
        expect(tokens[2]).to.be.an.instanceof(OutputRedirectionSymbol);
        expect(tokens[3]).to.be.an.instanceof(Word);
        expect(tokens[4]).to.be.an.instanceof(EndOfInput);

        expect(tokens.map(token => token.value)).to.eql(["cat", "file", ">", "another_file", ""]);
    });

    it("recognizes appending output redirection", () => {
        const tokens = scan("cat file >> another_file");

        expect(tokens.length).to.eq(5);
        expect(tokens[0]).to.be.an.instanceof(Word);
        expect(tokens[1]).to.be.an.instanceof(Word);
        expect(tokens[2]).to.be.an.instanceof(AppendingOutputRedirectionSymbol);
        expect(tokens[3]).to.be.an.instanceof(Word);
        expect(tokens[4]).to.be.an.instanceof(EndOfInput);

        expect(tokens.map(token => token.value)).to.eql(["cat", "file", ">>", "another_file", ""]);
    });

    describe("invalid input", () => {
        it("adds an invalid token", async() => {
            const tokens = scan("cd '");

            expect(tokens.length).to.eq(3);
            expect(tokens[0]).to.be.an.instanceof(Word);
            expect(tokens[1]).to.be.an.instanceof(Invalid);
            expect(tokens[2]).to.be.an.instanceof(EndOfInput);

            expect(tokens.map(token => token.value)).to.eql(["cd", "'", ""]);
        });
    });
});
