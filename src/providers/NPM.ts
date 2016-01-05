import Utils from '../Utils';
import Prompt from "../Prompt";
import * as i from '../Interfaces';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as Path from 'path';
var score: (i: string, m: string) => number = require('fuzzaldrin').score;

export default class NPM implements i.AutocompletionProvider {
    async getSuggestions(prompt: Prompt): Promise<Suggestion[]> {
        const lexemes = prompt.lexemes;

        if (lexemes.length !== 3 || !_.eq(_.take(lexemes, 2), ['npm', 'run'])) {
            return [];
        }

        const thirdLexeme = lexemes[2];
        const packageFilePath = Path.join(prompt.getCWD(), 'package.json');


        return new Promise((resolve: (suggestions: Suggestion[]) => Promise<Suggestion[]>) => {
            Utils.ifExists(packageFilePath, () => {
                fs.readFile(packageFilePath, (error, buffer) => {
                    const suggestions = Object.keys(JSON.parse(buffer.toString()).scripts || {}).map(key => {
                            return {
                                value: key,
                                score: 2 + score(key, thirdLexeme),
                                synopsis: '',
                                description: '',
                                type: 'option'
                            }
                        }
                    );

                    resolve(_._(suggestions).sortBy('score').reverse().value());
                });
            })
        });
    }
}
