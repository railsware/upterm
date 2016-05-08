import {expect} from "chai";
import {makeGrammar} from "../src/Autocompletion";
import {context, suggestionDisplayValues} from "./helpers";
import {InputMethod} from "../src/Parser";

const aliases = {
    gs: "git status",
};

const grammar = makeGrammar(aliases);

describe("grammar", () => {
    describe("input method", () => {
        it("displays a finished alias when typed", async() => {
            const results = await grammar(context({input: "git status", inputMethod: InputMethod.Typed}));
            expect(suggestionDisplayValues(results)).to.eql(["status"]);
        });

        it("doesn't display a finished alias when autocompleted", async() => {
            const results = await grammar(context({input: "git status", inputMethod: InputMethod.Autocompleted}));
            expect(suggestionDisplayValues(results)).to.eql([]);
        });
    });
});
