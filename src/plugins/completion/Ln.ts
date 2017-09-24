import {PluginManager} from "../../PluginManager";
import {anyFilesSuggestionsProvider} from "../completion_utils/Common";
import {combine} from "../completion_utils/Combine";
import {manPageOptions} from "../../utils/ManPages";

const combinedOptions = combine([anyFilesSuggestionsProvider, manPageOptions("ln")]);
PluginManager.registerAutocompletionProvider("ln", combinedOptions);
PluginManager.registerAutocompletionProvider("link", combinedOptions);
