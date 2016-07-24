import {PluginManager} from "../../PluginManager";
import {manPageToOptions} from "../../utils/ManPages";

manPageToOptions("shutdown").then(manPageOptions => {
    PluginManager.registerAutocompletionProvider("shutdown", manPageOptions);
});
