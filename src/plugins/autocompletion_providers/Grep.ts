import {PluginManager} from "../../PluginManager";
import {longAndShortFlag, mapSuggestions, combine} from "./Common";

const options = combine([
    mapSuggestions(longAndShortFlag("count"), suggestion => suggestion.withDescription("Only a count of selected lines is written to standard output.")),
]);

PluginManager.registerAutocompletionProvider("grep", options);
