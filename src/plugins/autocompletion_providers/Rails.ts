import PluginManager from "../../PluginManager";
import {Subcommand} from "./Suggestions";

const subcommands = [
    new Subcommand("runner").withSynopsis("Run a piece of code in the application environment"),
    new Subcommand("console").withSynopsis("Start the Rails console"),
    new Subcommand("server").withSynopsis("Start the Rails server"),
    new Subcommand("generate").withSynopsis("Generate new code'g')"),
    new Subcommand("destroy").withSynopsis('Undo code generated with "generate"'),
    new Subcommand("dbconsole").withSynopsis("Start a console for the Rails database"),
    new Subcommand("new").withSynopsis("Create a new Rails application"),
    new Subcommand("plugin new").withSynopsis("Generates skeleton for developing a Rails plugin"),
];

PluginManager.registerAutocompletionProvider({
    forCommand: "rails",
    getSuggestions: async (job) => subcommands,
});
