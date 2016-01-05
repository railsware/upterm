import Utils from '../Utils';
import Prompt from "../Prompt";
import * as i from '../Interfaces';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as Path from 'path';
var score: (i: string, m: string) => number = require('fuzzaldrin').score;

export default class NPM implements i.AutocompletionProvider {
    async getSuggestions(prompt: Prompt): Promise<Suggestion[]> {
        const words = prompt.expanded;

        if (words.length !== 3 || !_.eq(_.take(words, 2), ['npm', 'run'])) {
            return [];
        }

        const packageFilePath = Path.join(prompt.getCWD(), 'package.json');

        if (!(await Utils.exists(packageFilePath))) {
            return [];
        }

        const lastWord = _.last(words);
        const content = await Utils.readFile(packageFilePath);

        const suggestions = Object.keys(JSON.parse(content).scripts || {}).map(key => {
                return {
                    value: key,
                    score: 2 + score(key, lastWord),
                    synopsis: '',
                    description: '',
                    type: 'option'
                }
            }
        );

        return _._(suggestions).sortBy('score').reverse().value();
    }
}
