import Utils from '../../Utils';
import Prompt from "../../Prompt";
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
    getSuggestions: async function (prompt: Prompt): Promise<Suggestion[]> {
        const words = prompt.expanded;

        if (words[0] !== 'git' || words[1] !== 'checkout') {
            return [];
        }

        const lastWord = _.last(words);
        var suggestions: Suggestion[] = [];

        const headsPath = Path.join(prompt.getCWD(), '.git', 'refs', 'heads');

        if (words.length === 3 && await Utils.exists(headsPath)) {
            const files = await Utils.filesIn(headsPath);
            suggestions = files.map(branch => toSuggestion(branch, lastWord));
        }

        return _._(suggestions).sortBy('score').reverse().value();
    }
});
