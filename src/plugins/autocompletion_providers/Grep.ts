import {PluginManager} from "../../PluginManager";
import {Option} from "./Suggestions";

const options = [
    new Option("count").withDescription("Only a count of selected lines is written to standard output."),
];

PluginManager.registerAutocompletionProvider("grep", async (context) => options);
