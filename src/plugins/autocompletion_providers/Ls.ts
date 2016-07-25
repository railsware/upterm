import {PluginManager} from "../../PluginManager";
import {combine, directoriesSuggestionsProvider} from "./Common";
import {manPageToOptions} from "../../utils/ManPages";

manPageToOptions("ls").then(manPageOptions => {
    PluginManager.registerAutocompletionProvider("ls", combine([directoriesSuggestionsProvider, manPageOptions]));
});
