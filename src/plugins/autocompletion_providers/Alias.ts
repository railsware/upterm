import * as i from '../../Interfaces';
import * as _ from 'lodash';
import Aliases from '../../Aliases';
import Job from "../../Job";
import Autocompletion from "../../Autocompletion";
import PluginManager from "../../PluginManager"
var score: (i: string, m: string) => number = require('fuzzaldrin').score;

class Alias implements i.AutocompletionProvider {
    async getSuggestions(job: Job) {
        const prompt = job.getPrompt();

        if (prompt.lexemes.length > 1) {
            return [];
        }

        const lastLexeme = prompt.lastLexeme;
        var all = _.map(Aliases.all, (alias: string, expanded: string) => {
            return {
                value: expanded,
                score: 2 * (score(alias, lastLexeme) + (score(expanded, lastLexeme) * 0.5)),
                synopsis: alias,
                description: `Aliased to “${expanded}”.`,
                type: 'alias',
            }
        });

        return _._(all).sortBy('score').reverse().take(Autocompletion.limit).value();
    }
}

PluginManager.registerAutocompletionProvider(new Alias());
