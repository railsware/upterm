import {expect} from "chai";
import {string, choice} from "../src/Parser.ts";
import {Suggestion} from "../src/plugins/autocompletion_providers/Suggestions";

const context = {
    directory: "/",
};
const valuesOf = (suggestions: Suggestion[]) => suggestions.map(suggestion => suggestion.value);

describe("parser", () => {
    it("returns suggestions", async() => {
        const derived = await string("git")
            .bind(string(" "))
            .bind(choice([string("commit"), string("checkout"), string("merge")]))
            .parse("git c", context);
        const suggestions = await derived.suggestions(context);

        expect(valuesOf(suggestions)).to.eql(["commit", "checkout"]);
    });
});
