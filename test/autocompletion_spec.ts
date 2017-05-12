import "mocha";
import {expect} from "chai";
import {getSuggestions} from "../src/Autocompletion";
import {Environment} from "../src/shell/Environment";
import {OrderedSet} from "../src/utils/OrderedSet";
import {Aliases} from "../src/shell/Aliases";
import {CommandWord} from "../src/shell/Parser";
import {Word} from "../src/shell/Scanner";
import {
    styles,
    anyFilesSuggestions,
    noEscapeSpacesPromptSerializer,
} from "../src/plugins/autocompletion_utils/Common";
import {join} from "path";
import {fontAwesome} from "../src/views/css/FontAwesome";

describe("Autocompletion suggestions", () => {
    it("includes aliases", async() => {
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
            },
        }]);
    });

    it("wraps file names in quotes if necessary", async() => {
        expect(await anyFilesSuggestions("fil", join(__dirname, "test_files", "file_names_test"))).to.eql([{
            attributes: {
                displayValue: "file with brackets()",
                promptSerializer: noEscapeSpacesPromptSerializer,
                value: "file\\ with\\ brackets\\(\\)",
                style: {
                    css: {},
                    value: fontAwesome.file,
                },
            },
        }]);
    });
});
