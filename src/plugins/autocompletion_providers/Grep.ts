import {PluginManager} from "../../PluginManager";
import {longAndShortFlag} from "./Suggestions";

const options = [
    longAndShortFlag("count").withDescription("Only a count of selected lines is written to standard output."),
];

PluginManager.registerAutocompletionProvider("grep", async (context) => options);
