import {PluginManager} from "../../PluginManager";
import {manPageOptions} from "../../utils/ManPages";

PluginManager.registerAutocompletionProvider("locate", manPageOptions("locate"));
