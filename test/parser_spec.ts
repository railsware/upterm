import {expect} from "chai";
import {string, choice} from "../src/Parser.ts";

describe("parser", () => {
    it("returns suggestions", async() => {
        const result = await string("git")
            .bind(string(" "))
            .bind(choice(string("commit"), string("checkout")))
            .parse("git c");

        expect(result.suggestions).to.eql(["ommit", "heckout"]);
    });
});
