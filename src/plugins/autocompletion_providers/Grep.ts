import {PluginManager} from "../../PluginManager";
import {longAndShortFlag, mapSuggestions} from "./Suggestions";

const options = [
    mapSuggestions(longAndShortFlag("count"), suggestion => suggestion.withDescription("Only a count of selected lines is written to standard output.")),
];

PluginManager.registerAutocompletionProvider("grep", async (context) => options);
