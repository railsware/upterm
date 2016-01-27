import PluginManager from "../../PluginManager";
import {fileSuggestions} from "./Suggestions";

PluginManager.registerAutocompletionProvider({ getSuggestions: fileSuggestions });
