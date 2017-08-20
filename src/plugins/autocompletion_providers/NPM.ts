import * as Path from "path";
import {commandWithSubcommands} from "../autocompletion_utils/Common";
import {io, mapObject} from "../../utils/Common";
import {PluginManager} from "../../PluginManager";
import {AutocompletionContext} from "../../Interfaces";

const npmCommandConfig = [
    {
        name: "access",
        description: "Set access level on published packages",
    },
    {
        name: "adduser",
        description: "Add a registry user account",
    },
    {
        name: "bin",
        description: "Display npm bin folder",
    },
    {
        name: "bugs",
        description: "Bugs for a package in a web browser maybe",
    },
    {
        name: "build",
        description: "Build a package",
    },
    {
        name: "bundle",
        description: "REMOVED",
    },
    {
        name: "cache",
        description: "Manipulates packages cache",
    },
    {
        name: "completion",
        description: "Tab Completion for npm",
    },
    {
        name: "config",
        description: "Manage the npm configuration files",
    },
    {
        name: "dedupe",
        description: "Reduce duplication",
    },
    {
        name: "deprecate",
        description: "Deprecate a version of a package",
    },
    {
        name: "dist-tag",
        description: "Modify package distribution tags",
    },
    {
        name: "docs",
        description: "Docs for a package in a web browser maybe",
    },
    {
        name: "edit",
        description: "Edit an installed package",
    },
    {
        name: "explore",
        description: "Browse an installed package",
    },
    {
        name: "help",
        description: "Get help on npm",
    },
    {
        name: "help-search",
        description: "Search npm help documentation",
    },
    {
        name: "init",
        description: "Interactively create a package.json file",
    },
    {
        name: "install",
        description: "Install a package",
    },
    {
        name: "install-test",
        description: "",
    },
    {
        name: "link",
        description: "Symlink a package folder",
    },
    {
        name: "logout",
        description: "Log out of the registry",
    },
    {
        name: "ls",
        description: "List installed packages",
    },
    {
        name: "npm",
        description: "javascript package manager",
    },
    {
        name: "outdated",
        description: "Check for outdated packages",
    },
    {
        name: "owner",
        description: "Manage package owners",
    },
    {
        name: "pack",
        description: "Create a tarball from a package",
    },
    {
        name: "ping",
        description: "Ping npm registry",
    },
    {
        name: "prefix",
        description: "Display prefix",
    },
    {
        name: "prune",
        description: "Remove extraneous packages",
    },
    {
        name: "publish",
        description: "Publish a package",
    },
    {
        name: "rebuild",
        description: "Rebuild a package",
    },
    {
        name: "repo",
        description: "Open package repository page in the browser",
    },
    {
        name: "restart",
        description: "Restart a package",
    },
    {
        name: "root",
        description: "Display npm root",
    },
    {
        name: "run",
        description: "Run arbitrary package scripts",
        provider: async (context: AutocompletionContext) => {
            const packageFilePath = Path.join(context.environment.pwd, "package.json");
            if (await io.fileExists(packageFilePath)) {
                const parsed = JSON.parse(await io.readFile(packageFilePath)).scripts || {};
                return mapObject(parsed, (key: string, value: string) => ({
                    label: key,
                    description: value,
                }));
            } else {
                return [];
            }
        },
    },
    {
        name: "search",
        description: "Search for packages",
    },
    {
        name: "shrinkwrap",
        description: "Lock down dependency versions",
    },
    {
        name: "star",
        description: "Mark your favorite packages",
    },
    {
        name: "stars",
        description: "View packages marked as favorites",
    },
    {
        name: "start",
        description: "Start a package",
    },
    {
        name: "stop",
        description: "Stop a package",
    },
    {
        name: "tag",
        description: "Tag a published version",
    },
    {
        name: "team",
        description: "Manage organization teams and team memberships",
    },
    {
        name: "test",
        description: "Test a package",
    },
    {
        name: "uninstall",
        description: "Remove a package",
    },
    {
        name: "unpublish",
        description: "Remove a package from the registry",
    },
    {
        name: "update",
        description: "Update a package",
    },
    {
        name: "version",
        description: "Bump a package version",
    },
    {
        name: "view",
        description: "View registry info",
    },
    {
        name: "whoami",
        description: "Display npm username",
    },
];

PluginManager.registerAutocompletionProvider("npm", commandWithSubcommands(npmCommandConfig));
