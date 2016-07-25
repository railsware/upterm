import {PluginManager} from "../../PluginManager";
import {combine, anyFilesSuggestionsProvider} from "./Common";
import {manPageOptions} from "../../utils/ManPages";

const combinedOptions = combine([anyFilesSuggestionsProvider, manPageOptions("ln")]);
PluginManager.registerAutocompletionProvider("ln", combinedOptions);
PluginManager.registerAutocompletionProvider("link", combinedOptions);
