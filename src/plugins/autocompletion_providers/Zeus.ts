import PluginManager from "../../PluginManager";
import {Subcommand} from "./Suggestions";

const subcommands = [
    new Subcommand("start").withSynopsis("Start a zeus server in the current directory using zeus.json"),
    new Subcommand("init").withSynopsis("Generate a template zeus.json"),
    new Subcommand("rake").withSynopsis("Ruby Make"),
    new Subcommand("runner").withSynopsis("Run a piece of code in the application environment"),
    new Subcommand("console").withSynopsis("Start the Rails console"),
    new Subcommand("server").withSynopsis("Start the Rails server"),
    new Subcommand("generate").withSynopsis("Generate new code'g')"),
    new Subcommand("destroy").withSynopsis('Undo code generated with "generate"'),
    new Subcommand("dbconsole").withSynopsis("Start a console for the Rails database"),
    new Subcommand("rspec").withSynopsis("Run specs"),
];

PluginManager.registerAutocompletionProvider({
    forCommand: "zeus",
    getSuggestions: async (job) => subcommands,
});
