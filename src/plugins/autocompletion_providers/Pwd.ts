import {PluginManager} from "../../PluginManager";
import {manPageToOptions} from "../../utils/ManPages";

manPageToOptions("pwd").then(manPageOptions => {
    PluginManager.registerAutocompletionProvider("pwd", manPageOptions);
});
