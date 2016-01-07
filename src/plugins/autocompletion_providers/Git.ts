import Utils from '../../Utils';
import Job from "../../Job";
import * as _ from 'lodash';
import * as Path from 'path';
import PluginManager from "../../PluginManager";
var score: (i: string, m: string) => number = require('fuzzaldrin').score;


function toSuggestion(branch: string, lastWord: string): Suggestion {
    return {
        value: branch,
        score: 2 + score(branch, lastWord),
        synopsis: '',
        description: '',
        type: 'branch'
    }
}

PluginManager.registerAutocompletionProvider({
    getSuggestions: async function (job: Job): Promise<Suggestion[]> {
        const prompt = job.prompt;

        if (prompt.commandName !== 'git' || prompt.arguments[0] !== 'checkout') {
            return [];
        }

        const lastArgument = prompt.lastArgument;
        var suggestions: Suggestion[] = [];

        const headsPath = Path.join(job.directory, '.git', 'refs', 'heads');

        if (prompt.arguments.length === 2 && await Utils.exists(headsPath)) {
            const files = await Utils.filesIn(headsPath);
            suggestions = files.map(branch => toSuggestion(branch, lastArgument));
        }

        return _._(suggestions).sortBy('score').reverse().value();
    }
});
