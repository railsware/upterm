import {PluginManager} from "../../PluginManager";
import {directoriesSuggestionsProvider} from "../autocompletion_utils/Common";
import combine from "../autocompletion_utils/Combine";
import {manPageOptions} from "../../utils/ManPages";

PluginManager.registerAutocompletionProvider("mkdir", combine([manPageOptions("mkdir"), directoriesSuggestionsProvider]));
