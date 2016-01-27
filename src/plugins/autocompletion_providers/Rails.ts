import PluginManager from "../../PluginManager";
import {toSubcommands} from "./Suggestions";

const subcommands = toSubcommands({
    runner: "Run a piece of code in the application environment",
    console: "Start the Rails console",
    server: "Start the Rails server",
    generate: "Generate new code'g')",
    destroy: 'Undo code generated with "generate"',
    dbconsole: "Start a console for the Rails database",
    "new": "Create a new Rails application",
    "plugin new": "Generates skeleton for developing a Rails plugin",
});

PluginManager.registerAutocompletionProvider({
    forCommand: "rails",
    getSuggestions: async (job) => subcommands,
});
