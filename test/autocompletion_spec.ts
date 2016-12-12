import "mocha";
import {expect} from "chai";
import {getSuggestions} from "../src/Autocompletion";
import {Environment} from "../src/shell/Environment";
import {OrderedSet} from "../src/utils/OrderedSet";
import {Aliases} from "../src/shell/Aliases";
import {CommandWord} from "../src/shell/Parser";
import {Word} from "../src/shell/Scanner";
import {styles} from "../src/plugins/autocompletion_utils/Common";

describe("Autocompletion suggestions", () => {
    it("include aliases", async() => {
        expect(await getSuggestions({
            currentText: "myAlia",
            currentCaretPosition: 6,
            ast: new CommandWord(new Word("myAlia", 0)),
            environment: new Environment({}),
            historicalPresentDirectoriesStack: new OrderedSet<string>(),
            aliases: new Aliases({
              myAlias: "expandedAlias",
            }),
        })).to.eql([{
          attributes: {
            description: "expandedAlias",
            space: true,
            style: styles.alias,
            value: "myAlias",
          }
        }]);
    });
});
