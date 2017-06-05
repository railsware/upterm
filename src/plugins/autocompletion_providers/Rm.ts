import {PluginManager} from "../../PluginManager";
import {anyFilesSuggestionsProvider} from "../autocompletion_utils/Common";
import {combine} from "../autocompletion_utils/Combine";
import {manPageOptions} from "../../utils/ManPages";

PluginManager.registerAutocompletionProvider("rm", combine([manPageOptions("rm"), anyFilesSuggestionsProvider]));
