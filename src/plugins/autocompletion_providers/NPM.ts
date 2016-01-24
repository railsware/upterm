import Utils from "../../Utils";
import Job from "../../Job";
import * as _ from "lodash";
import * as Path from "path";
import * as i from "../../Interfaces";
import PluginManager from "../../PluginManager";
const score: (i: string, m: string) => number = require("fuzzaldrin").score;

const subcommands: Dictionary<string> = {
    "access": "Set access level on published packages",
    "adduser": "Add a registry user account",
    "bin": "Display npm bin folder",
    "bugs": "Bugs for a package in a web browser maybe",
    "build": "Build a package",
    "bundle": "REMOVED",
    "cache": "Manipulates packages cache",
    "completion": "Tab Completion for npm",
    "config": "Manage the npm configuration files",
    "dedupe": "Reduce duplication",
    "deprecate": "Deprecate a version of a package",
    "dist-tag": "Modify package distribution tags",
    "docs": "Docs for a package in a web browser maybe",
    "edit": "Edit an installed package",
    "explore": "Browse an installed package",
    "help": "Get help on npm",
    "help-search": "Search npm help documentation",
    "init": "Interactively create a package.json file",
    "install": "Install a package",
    "install-test": "",
    "link": "Symlink a package folder",
    "logout": "Log out of the registry",
    "ls": "List installed packages",
    "npm": "javascript package manager",
    "outdated": "Check for outdated packages",
    "owner": "Manage package owners",
    "pack": "Create a tarball from a package",
    "ping": "Ping npm registry",
    "prefix": "Display prefix",
    "prune": "Remove extraneous packages",
    "publish": "Publish a package",
    "rebuild": "Rebuild a package",
    "repo": "Open package repository page in the browser",
    "restart": "Restart a package",
    "root": "Display npm root",
    "run": "Run arbitrary package scripts",
    "run-script": "Run arbitrary package scripts",
    "search": "Search for packages",
    "shrinkwrap": "Lock down dependency versions",
    "star": "Mark your favorite packages",
    "stars": "View packages marked as favorites",
    "start": "Start a package",
    "stop": "Stop a package",
    "tag": "Tag a published version",
    "team": "Manage organization teams and team memberships",
    "test": "Test a package",
    "uninstall": "Remove a package",
    "unpublish": "Remove a package from the registry",
    "update": "Update a package",
    "version": "Bump a package version",
    "view": "View registry info",
    "whoami": "Display npm username",
};


function toSuggestion(value: string, lastWord: string, synopsis = ""): i.Suggestion {
    return {
        value: value,
        score: 2 + score(value, lastWord),
        synopsis: synopsis,
        description: "",
        type: "command",
    };
}

PluginManager.registerAutocompletionProvider({
    forCommand: "npm",
    getSuggestions: async function (job: Job): Promise<i.Suggestion[]> {
        if (job.prompt.expanded.length !== 2) {
            return [];
        }

        const suggestions = _.map(subcommands, (value, key) => toSuggestion(key, job.prompt.lastArgument, value));
        return _._(suggestions).sortBy("score").reverse().value();
    },
});

PluginManager.registerAutocompletionProvider({
    forCommand: "npm run",
    getSuggestions: async function (job: Job): Promise<i.Suggestion[]> {
        const packageFilePath = Path.join(job.directory, "package.json");

        if (job.prompt.expanded.length === 3 && await Utils.exists(packageFilePath)) {
            const parsed = JSON.parse(await Utils.readFile(packageFilePath)).scripts || {};
            return Object.keys(parsed).map(key => toSuggestion(key, job.prompt.lastArgument));
        }

        return [];
    },
});
