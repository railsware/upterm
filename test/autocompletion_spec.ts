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
    it("includes aliases", async () => {
        const expectedSuggestions = [{
            attributes: {
                value: "myAlias",
                description: "expandedAlias",
                style: styles.alias,
                space: true,
            },
        }];

        const suggestions = await getSuggestions({
            currentText: "myAlia",
            currentCaretPosition: 6,
            ast: new CommandWord(new Word("myAlia", 0)),
            environment: new Environment({}),
            historicalPresentDirectoriesStack: new OrderedSet<string>(),
            aliases: new Aliases({
                myAlias: "expandedAlias",
            }),
        });

        expect(JSON.stringify(suggestions)).to.eql(JSON.stringify(expectedSuggestions));
    });

    it("wraps file names in quotes if necessary", async () => {
        const expectedSuggestions = [{
            attributes: {
                value: "file\\ with\\ brackets\\(\\)",
                displayValue: "file with brackets()",
                promptSerializer: noEscapeSpacesPromptSerializer,
                style: {
                    value: fontAwesome.file,
                    css: {},
                },
            },
        }];
        const suggestions = await anyFilesSuggestions("fil", join(__dirname, "test_files", "file_names_test"));

        expect(JSON.stringify(suggestions)).to.eql(JSON.stringify(expectedSuggestions));
    });
});
