import {expect} from "chai";
import {lex} from "../src/CommandExpander";

describe("sldfsdf", () => {
    it("fasfd", () => {
        expect(lex("some words")).to.eql(["some", "words"]);
    });
});
