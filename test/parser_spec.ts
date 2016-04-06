import {expect} from "chai";
import {item, sat, plus, pplus, char, str, seq, symbol, many, choice, branch, token} from "../src/Parser";

describe("parser", () => {
    describe("item", () => {
        it("parses the first character", async() => {
            const result = await item({string: "hello"});

            expect(result.length).to.eql(1);
            expect(result[0]).to.eql({parse: "h", rest: "ello"});
        });

        it("fails with an empty string", async() => {
            const result = await item({string: ""});

            expect(result.length).to.eql(0);
        });
    });

    describe("sat", () => {
        context("predicate matches", () => {
            it("parses the first character", async() => {
                const result = await sat(c => c === "h")({string: "hello"});

                expect(result.length).to.eql(1);
                expect(result[0]).to.eql({parse: "h", rest: "ello"});
            });
        });

        context("predicate doesn't match", () => {
            it("parses the first character", async() => {
                const result = await sat(c => c === "H")({string: "hello"});

                expect(result.length).to.eql(0);
            });
        });
    });

    describe("char", () => {
        context("matches", () => {
            it("parses the first character", async() => {
                const result = await char("h")({string: "hello"});

                expect(result.length).to.eql(1);
                expect(result[0]).to.eql({parse: "h", rest: "ello"});
            });
        });

        context("doesn't match", () => {
            it("returns an empty array", async() => {
                const result = await char("H")({string: "hello"});

                expect(result.length).to.eql(0);
            });
        });
    });

    describe("str", () => {
        context("empty string to match", () => {
            it("parses the string", async() => {
                const result = await str("")({string: "hello"});

                expect(result.length).to.eql(1);
                expect(result[0]).to.eql({parse: "", rest: "hello"});
            });
        });

        context("matches", () => {
            it("parses the string", async() => {
                const result = await str("hel")({string: "hello"});

                expect(result.length).to.eql(1);
                expect(result[0]).to.eql({parse: "hel", rest: "lo"});
            });
        });

        context("doesn't match", () => {
            it("returns an empty array", async() => {
                const result = await str("hek")({string: "hello"});

                expect(result.length).to.eql(0);
            });
        });
    });

    describe("plus", () => {
        it("returns results of both parsers", async() => {
            const result = await plus(item, item)({string: "hello"});

            expect(result.length).to.eql(2);
            expect(result[0]).to.eql({parse: "h", rest: "ello"});
            expect(result[1]).to.eql({parse: "h", rest: "ello"});
        });
    });

    describe("pplus", () => {
        context("the first parser doesn't match", () => {
            it("returns the first result", async() => {
                const result = await pplus(char("k"), item)({string: "hello"});

                expect(result.length).to.eql(1);
                expect(result[0]).to.eql({parse: "h", rest: "ello"});
            });
        });

        context("the second parser doesn't match", () => {
            it("returns the first result", async() => {
                const result = await pplus(item, char("k"))({string: "hello"});

                expect(result.length).to.eql(1);
                expect(result[0]).to.eql({parse: "h", rest: "ello"});
            });
        });

        context("both parsers match", () => {
            it("returns the first result", async() => {
                const result = await pplus(item, item)({string: "hello"});

                expect(result.length).to.eql(1);
                expect(result[0]).to.eql({parse: "h", rest: "ello"});
            });
        });

        context("neither parser matches", () => {
            it("returns an empty array", async() => {
                const result = await pplus(char("k"), char("k"))({string: "hello"});

                expect(result.length).to.eql(0);
            });
        });
    });

    describe("seq", () => {
        context("the first parser doesn't match", () => {
            it("returns no results", async() => {
                const result = await seq(char("H"), char("e"))({string: "hello"});

                expect(result.length).to.eql(0);
            });
        });

        context("the second parser doesn't match", () => {
            it("returns no results", async() => {
                const result = await seq(char("h"), char("E"))({string: "hello"});

                expect(result.length).to.eql(0);
            });
        });

        context("both parsers match", () => {
            it("returns the combined result", async() => {
                const result = await seq(char("h"), char("e"))({string: "hello"});

                expect(result.length).to.eql(1);
                expect(result[0]).to.eql({parse: ["h", "e"], rest: "llo"});
            });
        });

        context("neither parser matches", () => {
            it("returns no results", async() => {
                const result = await seq(char("H"), char("E"))({string: "hello"});

                expect(result.length).to.eql(0);
            });
        });
    });

    describe("symbol", () => {
        it("parses a symbol", async() => {
            const result = await symbol("git")({string: "git commit"});

            expect(result.length).to.eql(1);
            expect(result[0]).to.eql({parse: "git", rest: "commit"});
        });
    });

    describe("many", () => {
        it("parses zero occurrences", async() => {
            const result = await many(symbol("git"))({string: "commit"});

            expect(result.length).to.eql(1);
            expect(result[0]).to.eql({parse: [], rest: "commit"});
        });

        it("parses multiple occurrences", async() => {
            const result = await many(symbol("git"))({string: "git git commit"});

            expect(result.length).to.eql(1);
            expect(result[0]).to.eql({parse: ["git", "git"], rest: "commit"});
        });
    });

    describe("choice", () => {
        context("no parsers", () => {
            it("returns no matches", async() => {
                const result = await choice([])({string: "git commit"});

                expect(result.length).to.eql(0);
            });
        });

        context("one parser", () => {
            context("matches", () => {
                it("returns all the matches", async() => {
                    const result = await choice([symbol("git")])({string: "git commit"});

                    expect(result).to.eql([
                        {parse: "git", rest: "commit"},
                    ]);
                });
            });

            context("doesn't match", () => {
                it("returns no matches", async() => {
                    const result = await choice([symbol("hg")])({string: "git commit"});

                    expect(result.length).to.eql(0);
                });
            });
        });

        context("two parsers", () => {
            it("returns all the matches", async() => {
                const result = await choice([symbol("g"), symbol("gi")])({string: "git commit"});

                expect(result).to.eql([
                    {parse: "g", rest: "it commit"},
                    {parse: "gi", rest: "t commit"},
                ]);
            });
        });

        context("more than two parsers", () => {
            it("returns all the matches", async() => {
                const result = await choice([symbol("g"), symbol("gi"), symbol("git")])({string: "git commit"});

                expect(result).to.eql([
                    {parse: "g", rest: "it commit"},
                    {parse: "gi", rest: "t commit"},
                    {parse: "git", rest: "commit"},
                ]);
            });
        });
    });
});
