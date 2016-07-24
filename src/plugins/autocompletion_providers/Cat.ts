import {PluginManager} from "../../PluginManager";
import {combine, anyFilesSuggestionsProvider} from "./Common";
import {manPageToOptions} from "../../utils/ManPages";

manPageToOptions("cat").then(manPageOptions => {
    PluginManager.registerAutocompletionProvider("cat", combine([anyFilesSuggestionsProvider, manPageOptions]));
});
