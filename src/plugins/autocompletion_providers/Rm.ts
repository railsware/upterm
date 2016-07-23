import {PluginManager} from "../../PluginManager";
import {combine, anyFilesSuggestionsProvider} from "./Common";
import {manPageToOptions} from "../../utils/ManPages";

manPageToOptions("rm").then(manPageOptions => {
    PluginManager.registerAutocompletionProvider("rm", combine([manPageOptions, anyFilesSuggestionsProvider]));
});
