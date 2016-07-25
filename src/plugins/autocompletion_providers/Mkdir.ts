import {PluginManager} from "../../PluginManager";
import {combine, directoriesSuggestionsProvider} from "./Common";
import {manPageOptions} from "../../utils/ManPages";

PluginManager.registerAutocompletionProvider("mkdir", combine([manPageOptions("mkdir"), directoriesSuggestionsProvider]));
