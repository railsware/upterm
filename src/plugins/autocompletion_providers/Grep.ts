import {PluginManager} from "../../PluginManager";
import {shortAndLongOption} from "./Suggestions";

const options = [
    shortAndLongOption("count").withDescription("Only a count of selected lines is written to standard output."),
];

PluginManager.registerAutocompletionProvider("grep", async (context) => options);
