import {expect} from "chai";
import {makeGrammar} from "../src/Autocompletion";
import {context, suggestionDisplayValues} from "./helpers";
import {scan} from "../src/shell/Scanner";

const aliases = {
    g: "git",
};

const grammar = makeGrammar(aliases);

describe("grammar", () => {
    describe("input method", () => {
        it("displays a finished suggestion when typed", async() => {
            const results = await grammar(context(scan("git status")));
            expect(suggestionDisplayValues(results)).to.eql(["status"]);
        });

        it("doesn't display a finished suggestion when autocompleted", async() => {
            const results = await grammar(context(scan("git status")));
            expect(suggestionDisplayValues(results)).to.eql([]);
        });
    });

    describe("aliases", () => {
        it("has the same suggestion for an alias and its value", async() => {
            const gResults = await grammar(context(scan("g ")));
            const gitResults = await grammar(context(scan("git ")));

            expect(suggestionDisplayValues(gResults)).to.eql(suggestionDisplayValues(gitResults));
        });
    });
});
