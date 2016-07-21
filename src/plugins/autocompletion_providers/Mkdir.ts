import {PluginManager} from "../../PluginManager";
import {combine, directoriesSuggestionsProvider} from "./Common";
import {manPageToOptions} from "../../utils/ManPages";

manPageToOptions("mkdir").then(manPageOptions => {
    PluginManager.registerAutocompletionProvider("mkdir", combine([manPageOptions, directoriesSuggestionsProvider]));
});
