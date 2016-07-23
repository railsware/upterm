import {PluginManager} from "../../PluginManager";
import {combine, anyFilesSuggestionsProvider} from "./Common";
import {manPageToOptions} from "../../utils/ManPages";

manPageToOptions("mv").then(manPageOptions => {
    PluginManager.registerAutocompletionProvider("mv", combine([manPageOptions, anyFilesSuggestionsProvider]));
});
