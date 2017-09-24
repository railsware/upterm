import {PluginManager} from "../../PluginManager";
import {directoriesSuggestionsProvider} from "../completion_utils/Common";
import {combine} from "../completion_utils/Combine";
import {manPageOptions} from "../../utils/ManPages";

const tailOptions = manPageOptions("tail");

PluginManager.registerAutocompletionProvider("tail", combine([directoriesSuggestionsProvider, tailOptions]));
