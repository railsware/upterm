import {PluginManager} from "../../PluginManager";
import {combine, anyFilesSuggestionsProvider} from "./Common";
import {manPageToOptions} from "../../utils/ManPages";
import {AutocompletionContext} from "../../Interfaces";


manPageToOptions("rm").then(manPageOptions => {
    PluginManager.registerAutocompletionProvider("rm", combine([manPageOptions, anyFilesSuggestionsProvider]));
});
