import {expect} from "chai";
import {string} from "../src/Parser.ts";

describe("parser", () => {
    it("returns suggestions", async() => {
        const result = await string("git")
            .bind(string(" "))
            .bind(string("commit").or(string("checkout")))
            .parse("git c");

        expect(result.suggestions).to.eql(["ommit", "heckout"]);
    });
});
