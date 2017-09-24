import {PluginManager} from "../../PluginManager";
import {anyFilesSuggestionsProvider} from "../completion_utils/Common";
import {combine} from "../completion_utils/Combine";
import {manPageOptions} from "../../utils/ManPages";

PluginManager.registerAutocompletionProvider("cp", combine([anyFilesSuggestionsProvider, manPageOptions("cp")]));
