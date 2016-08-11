import {PluginManager} from "../../PluginManager";
import {anyFilesSuggestionsProvider} from "../autocompletion_utils/Common";
import combine from "../autocompletion_utils/Combine";
import {manPageOptions} from "../../utils/ManPages";

const combinedOptions = combine([anyFilesSuggestionsProvider, manPageOptions("ln")]);
PluginManager.registerAutocompletionProvider("ln", combinedOptions);
PluginManager.registerAutocompletionProvider("link", combinedOptions);
