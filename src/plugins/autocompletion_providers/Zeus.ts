import PluginManager from "../../PluginManager";
import {toSubcommands} from "./Suggestions";

const subcommands = toSubcommands({
    start: "Start a zeus server in the current directory using zeus.json",
    init: " Generate a template zeus.json",
    rake: "Ruby Make",
    runner: "Run a piece of code in the application environment",
    console: "Start the Rails console",
    server: "Start the Rails server",
    generate: "Generate new code'g')",
    destroy: 'Undo code generated with "generate"',
    dbconsole: "Start a console for the Rails database",
    rspec: "Run specs",
});

PluginManager.registerAutocompletionProvider({
    forCommand: "zeus",
    getSuggestions: async (job) => subcommands,
});
