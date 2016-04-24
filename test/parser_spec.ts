import {expect} from "chai";
import {string, choice} from "../src/Parser.ts";

describe("parser", () => {
    it("returns suggestions", async() => {
        const result = await string("git")
            .bind(string(" "))
            .bind(choice([string("commit"), string("checkout"), string("merge")]))
            .parse("git c");

        expect(result.suggestions).to.eql([
            {
                prefix: "c",
                value: "ommit",
            },
            {
                prefix: "c",
                value: "heckout",
            },
        ]);
    });
});
