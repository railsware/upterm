import {PluginManager} from "../../PluginManager";
import {directoriesSuggestionsProvider} from "../autocompletion_utils/Common";
import combine from "../autocompletion_utils/Combine";
import {manPageOptions} from "../../utils/ManPages";

PluginManager.registerAutocompletionProvider("ls", combine([directoriesSuggestionsProvider, manPageOptions("ls")]));
