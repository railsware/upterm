import {PluginManager} from "../../PluginManager";
import {longAndShortOption} from "./Suggestions";

const options = [
    longAndShortOption("count").withDescription("Only a count of selected lines is written to standard output."),
];

PluginManager.registerAutocompletionProvider("grep", async (context) => options);
