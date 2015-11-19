import Utils from '../Utils';
import * as i from '../Interfaces';
import * as _ from 'lodash';
import Prompt from "../Prompt";
import {parser} from "../CommandExpander";
import Autocompletion from "../Autocompletion";
var filter: any = require('fuzzaldrin').filter;

export default class Command implements i.AutocompletionProvider {
    suggestions: Suggestion[] = [];

    async getSuggestions(prompt: Prompt) {
        try {
            parser.yy.parseError = (err: any, hash: any) => {
                var filtered = _._(hash.expected).filter((value: string) => _.include(value, hash.token))
                    .map((value: string) => /^'(.*)'$/.exec(value)[1])
                    .value();

                this.suggestions = _.map(filtered, (value: string) => {
                    return {
                        value: value,
                        score: 10,
                        synopsis: '',
                        description: '',
                        type: value.startsWith('-') ? 'option' : 'command'
                    };
                });
            };

            parser.parse(prompt.expanded.join(' '));
            return [];
        } catch (exception) {
            return filter(this.suggestions, prompt.lastArgument, { key: 'value', maxResults: Autocompletion.limit });
        }
    }
}
