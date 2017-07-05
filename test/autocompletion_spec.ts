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
} from "../src/plugins/autocompletion_utils/Common";
import {join} from "path";
import {fontAwesome} from "../src/views/css/FontAwesome";
import * as Git from "../src/utils/Git";

describe("Autocompletion suggestions", () => {
    it("includes aliases", async () => {
        const expectedSuggestions = [{
            value: "myAlias",
            displayValue: "myAlias",
            description: "expandedAlias",
            synopsis: "expandedAlias",
            isFiltered: false,
            style: styles.alias,
            space: true,
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
            value: "file\\ with\\ brackets\\(\\)",
            displayValue: "file with brackets()",
            style: {
                value: fontAwesome.file,
                css: {},
            },
        }];
        const suggestions = await anyFilesSuggestions("fil", join(__dirname, "test_files", "file_names_test"));

        expect(JSON.stringify(suggestions)).to.eql(JSON.stringify(expectedSuggestions));

        // let a = <Git.GitDirectoryPath> __dirname;
        // a.__isGitDirectoryPath = Git.isGitDirectory(__dirname);
        // const currBranches = await Git.branches({directory: a, remotes: false, tags: false});
    });
});

describe("Util methods", () => {
    describe("Git methods", () => {
        const repoDirRoot = join(__dirname, "../");
        const repoGitDirectory = <Git.GitDirectoryPath> repoDirRoot;

        it("Current directory is in a git repository", async () => {
            expect(Git.isGitDirectory(repoDirRoot)).to.equal(true);
        });

        it("Git branches found for repo", async () => {
            let environment =  new Environment({});
            console.log("git dir check - " + __dirname);
            console.log("env path - " + environment.pwd);
            // console.log("upterm repo root dir - " + repoDirRoot);
            const currBranches =
                await Git.branches({directory: repoGitDirectory, remotes: false, tags: false});
            console.log("git branches length - " + currBranches.length);
            expect(currBranches.length).to.greaterThan(0);
        });

        it("Current git branch name exists", async () => {
            const currBranch = await Git.currentBranchName(repoGitDirectory);
            expect(currBranch.length).to.greaterThan(0);
        });
    });
});
