import ExecutionHistory from "../../History";
import Job from "../../Job";
import PluginManager from "../../PluginManager";
import {Suggestion} from "../../Interfaces";

class History extends Suggestion {
    constructor(protected _raw: string) {
        super();
    }

    get value(): string {
        return this._raw;
    }

    get type(): string {
        return "history";
    }

    getPrefix(job: Job): string {
        return job.prompt.value;
    }
}

PluginManager.registerAutocompletionProvider({
    getSuggestions: async function(job: Job) {
        return ExecutionHistory.all.filter(entry => entry.raw.length > 3).map(entry => {
            return new History(entry.raw);
        });
    },
});
