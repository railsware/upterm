import {PluginManager} from "../../PluginManager";
import {directoriesSuggestionsProvider, combineShortFlags} from "../completion_utils/Common";
import {combine} from "../completion_utils/Combine";
import {manPageOptions} from "../../utils/ManPages";

const lsOptions = combineShortFlags(manPageOptions("ls"));

PluginManager.registerAutocompletionProvider("ls", combine([directoriesSuggestionsProvider, lsOptions]));
