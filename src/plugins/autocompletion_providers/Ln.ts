import {PluginManager} from "../../PluginManager";
import {combine, anyFilesSuggestionsProvider} from "./Common";
import {manPageToOptions} from "../../utils/ManPages";

manPageToOptions("ln").then(manPageOptions => {
    const combinedOptions = combine([anyFilesSuggestionsProvider, manPageOptions]);
    PluginManager.registerAutocompletionProvider("ln", combinedOptions);
    PluginManager.registerAutocompletionProvider("link", combinedOptions);
});
