import PluginManager from "../../PluginManager";
import {fileSuggestions} from "./Suggestions";
import Job from "../../Job";

PluginManager.registerAutocompletionProvider({
    getSuggestions: async (job: Job) => await fileSuggestions(job.session.directory, job.prompt.lastArgument),
});
