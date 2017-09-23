import {PluginManager} from "../../PluginManager";
import {directoriesSuggestionsProvider, combineShortFlags} from "../autocompletion_utils/Common";
import {combine} from "../autocompletion_utils/Combine";
import {manPageOptions} from "../../utils/ManPages";

const tailOptions = combineShortFlags(manPageOptions("tail"));

PluginManager.registerAutocompletionProvider("tail", combine([directoriesSuggestionsProvider, tailOptions]));
