import {PluginManager} from "../../PluginManager";
import {manPageOptions} from "../../utils/ManPages";

PluginManager.registerAutocompletionProvider("pwd", manPageOptions("pwd"));
