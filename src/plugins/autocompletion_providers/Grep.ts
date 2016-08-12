import {PluginManager} from "../../PluginManager";
import {longAndShortFlag, mapSuggestions} from "../autocompletion_utils/Common";
import combine from "../autocompletion_utils/Combine";

const options = combine([
    mapSuggestions(longAndShortFlag("count"), suggestion => suggestion.withDescription("Only a count of selected lines is written to standard output.")),
]);

PluginManager.registerAutocompletionProvider("grep", options);
