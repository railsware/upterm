import {PluginManager} from "../../PluginManager";
import {combine, directoriesSuggestionsProvider} from "./Common";
import {manPageOptions} from "../../utils/ManPages";

PluginManager.registerAutocompletionProvider("ls", combine([directoriesSuggestionsProvider, manPageOptions("ls")]));
