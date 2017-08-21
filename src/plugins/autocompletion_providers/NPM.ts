import * as Path from "path";
import {commandWithSubcommands} from "../autocompletion_utils/Common";
import {io, mapObject} from "../../utils/Common";
import {PluginManager} from "../../PluginManager";
import {AutocompletionContext} from "../../Interfaces";

const npmCommandConfig = [
    {
        name: "access",
        detail: "Set access level on published packages",
    },
    {
        name: "adduser",
        detail: "Add a registry user account",
    },
    {
        name: "bin",
        detail: "Display npm bin folder",
    },
    {
        name: "bugs",
        detail: "Bugs for a package in a web browser maybe",
    },
    {
        name: "build",
        detail: "Build a package",
    },
    {
        name: "bundle",
        detail: "REMOVED",
    },
    {
        name: "cache",
        detail: "Manipulates packages cache",
    },
    {
        name: "completion",
        detail: "Tab Completion for npm",
    },
    {
        name: "config",
        detail: "Manage the npm configuration files",
    },
    {
        name: "dedupe",
        detail: "Reduce duplication",
    },
    {
        name: "deprecate",
        detail: "Deprecate a version of a package",
    },
    {
        name: "dist-tag",
        detail: "Modify package distribution tags",
    },
    {
        name: "docs",
        detail: "Docs for a package in a web browser maybe",
    },
    {
        name: "edit",
        detail: "Edit an installed package",
    },
    {
        name: "explore",
        detail: "Browse an installed package",
    },
    {
        name: "help",
        detail: "Get help on npm",
    },
    {
        name: "help-search",
        detail: "Search npm help documentation",
    },
    {
        name: "init",
        detail: "Interactively create a package.json file",
    },
    {
        name: "install",
        detail: "Install a package",
    },
    {
        name: "install-test",
        detail: "",
    },
    {
        name: "link",
        detail: "Symlink a package folder",
    },
    {
        name: "logout",
        detail: "Log out of the registry",
    },
    {
        name: "ls",
        detail: "List installed packages",
    },
    {
        name: "npm",
        detail: "javascript package manager",
    },
    {
        name: "outdated",
        detail: "Check for outdated packages",
    },
    {
        name: "owner",
        detail: "Manage package owners",
    },
    {
        name: "pack",
        detail: "Create a tarball from a package",
    },
    {
        name: "ping",
        detail: "Ping npm registry",
    },
    {
        name: "prefix",
        detail: "Display prefix",
    },
    {
        name: "prune",
        detail: "Remove extraneous packages",
    },
    {
        name: "publish",
        detail: "Publish a package",
    },
    {
        name: "rebuild",
        detail: "Rebuild a package",
    },
    {
        name: "repo",
        detail: "Open package repository page in the browser",
    },
    {
        name: "restart",
        detail: "Restart a package",
    },
    {
        name: "root",
        detail: "Display npm root",
    },
    {
        name: "run",
        detail: "Run arbitrary package scripts",
        provider: async (context: AutocompletionContext) => {
            const packageFilePath = Path.join(context.environment.pwd, "package.json");
            if (await io.fileExists(packageFilePath)) {
                const parsed = JSON.parse(await io.readFile(packageFilePath)).scripts || {};
                return mapObject(parsed, (key: string, value: string) => ({
                    label: key,
                    detail: value,
                }));
            } else {
                return [];
            }
        },
    },
    {
        name: "search",
        detail: "Search for packages",
    },
    {
        name: "shrinkwrap",
        detail: "Lock down dependency versions",
    },
    {
        name: "star",
        detail: "Mark your favorite packages",
    },
    {
        name: "stars",
        detail: "View packages marked as favorites",
    },
    {
        name: "start",
        detail: "Start a package",
    },
    {
        name: "stop",
        detail: "Stop a package",
    },
    {
        name: "tag",
        detail: "Tag a published version",
    },
    {
        name: "team",
        detail: "Manage organization teams and team memberships",
    },
    {
        name: "test",
        detail: "Test a package",
    },
    {
        name: "uninstall",
        detail: "Remove a package",
    },
    {
        name: "unpublish",
        detail: "Remove a package from the registry",
    },
    {
        name: "update",
        detail: "Update a package",
    },
    {
        name: "version",
        detail: "Bump a package version",
    },
    {
        name: "view",
        detail: "View registry info",
    },
    {
        name: "whoami",
        detail: "Display npm username",
    },
];

PluginManager.registerAutocompletionProvider("npm", commandWithSubcommands(npmCommandConfig));
