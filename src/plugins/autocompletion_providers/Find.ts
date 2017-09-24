import {PluginManager} from "../../PluginManager";
import {directoriesSuggestionsProvider, combineShortFlags} from "../autocompletion_utils/Common";
import {combine} from "../autocompletion_utils/Combine";
import {manPageOptions} from "../../utils/ManPages";

const findOptions = combineShortFlags(manPageOptions("find"));

PluginManager.registerAutocompletionProvider("find", combine([directoriesSuggestionsProvider, findOptions]));
