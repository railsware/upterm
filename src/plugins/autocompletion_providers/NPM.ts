import Utils from "../../Utils";
import Job from "../../Job";
import * as Path from "path";
import PluginManager from "../../PluginManager";
import {Suggestion, Subcommand, SubSubcommand} from "./Suggestions";

const subcommands = [
    new Subcommand("access").withSynopsis("Set access level on published packages"),
    new Subcommand("adduser").withSynopsis("Add a registry user account"),
    new Subcommand("bin").withSynopsis("Display npm bin folder"),
    new Subcommand("bugs").withSynopsis("Bugs for a package in a web browser maybe"),
    new Subcommand("build").withSynopsis("Build a package"),
    new Subcommand("bundle").withSynopsis("REMOVED"),
    new Subcommand("cache").withSynopsis("Manipulates packages cache"),
    new Subcommand("completion").withSynopsis("Tab Completion for npm"),
    new Subcommand("config").withSynopsis("Manage the npm configuration files"),
    new Subcommand("dedupe").withSynopsis("Reduce duplication"),
    new Subcommand("deprecate").withSynopsis("Deprecate a version of a package"),
    new Subcommand("dist-tag").withSynopsis("Modify package distribution tags"),
    new Subcommand("docs").withSynopsis("Docs for a package in a web browser maybe"),
    new Subcommand("edit").withSynopsis("Edit an installed package"),
    new Subcommand("explore").withSynopsis("Browse an installed package"),
    new Subcommand("help").withSynopsis("Get help on npm"),
    new Subcommand("help-search").withSynopsis("Search npm help documentation"),
    new Subcommand("init").withSynopsis("Interactively create a package.json file"),
    new Subcommand("install").withSynopsis("Install a package"),
    new Subcommand("install-test").withSynopsis(""),
    new Subcommand("link").withSynopsis("Symlink a package folder"),
    new Subcommand("logout").withSynopsis("Log out of the registry"),
    new Subcommand("ls").withSynopsis("List installed packages"),
    new Subcommand("npm").withSynopsis("javascript package manager"),
    new Subcommand("outdated").withSynopsis("Check for outdated packages"),
    new Subcommand("owner").withSynopsis("Manage package owners"),
    new Subcommand("pack").withSynopsis("Create a tarball from a package"),
    new Subcommand("ping").withSynopsis("Ping npm registry"),
    new Subcommand("prefix").withSynopsis("Display prefix"),
    new Subcommand("prune").withSynopsis("Remove extraneous packages"),
    new Subcommand("publish").withSynopsis("Publish a package"),
    new Subcommand("rebuild").withSynopsis("Rebuild a package"),
    new Subcommand("repo").withSynopsis("Open package repository page in the browser"),
    new Subcommand("restart").withSynopsis("Restart a package"),
    new Subcommand("root").withSynopsis("Display npm root"),
    new Subcommand("run").withSynopsis("Run arbitrary package scripts"),
    new Subcommand("run-script").withSynopsis("Run arbitrary package scripts"),
    new Subcommand("search").withSynopsis("Search for packages"),
    new Subcommand("shrinkwrap").withSynopsis("Lock down dependency versions"),
    new Subcommand("star").withSynopsis("Mark your favorite packages"),
    new Subcommand("stars").withSynopsis("View packages marked as favorites"),
    new Subcommand("start").withSynopsis("Start a package"),
    new Subcommand("stop").withSynopsis("Stop a package"),
    new Subcommand("tag").withSynopsis("Tag a published version"),
    new Subcommand("team").withSynopsis("Manage organization teams and team memberships"),
    new Subcommand("test").withSynopsis("Test a package"),
    new Subcommand("uninstall").withSynopsis("Remove a package"),
    new Subcommand("unpublish").withSynopsis("Remove a package from the registry"),
    new Subcommand("update").withSynopsis("Update a package"),
    new Subcommand("version").withSynopsis("Bump a package version"),
    new Subcommand("view").withSynopsis("View registry info"),
    new Subcommand("whoami").withSynopsis("Display npm username"),
];

PluginManager.registerAutocompletionProvider({
    forCommand: "npm",
    getSuggestions: async (job) => subcommands,
});

PluginManager.registerAutocompletionProvider({
    forCommand: "npm run",
    getSuggestions: async function (job: Job): Promise<Suggestion[]> {
        const packageFilePath = Path.join(job.session.directory, "package.json");

        if (job.prompt.expanded.length === 3 && await Utils.exists(packageFilePath)) {
            const parsed = JSON.parse(await Utils.readFile(packageFilePath)).scripts || {};
            return _.map(parsed, (value: string, key: string) => new SubSubcommand(key).withDescription(value));
        }

        return [];
    },
});
