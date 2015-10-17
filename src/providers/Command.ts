import Utils from '../Utils';
import * as i from '../Interfaces';
import * as _ from 'lodash';
import Prompt from "../Prompt";
var filter: any = require('fuzzaldrin').filter;

export default class Command implements i.AutocompletionProvider {
    suggestions: i.Suggestion[] = [];

    async getSuggestions(prompt: Prompt) {
        try {
            var input = prompt.parsableString;
            input.onParsingError = (err: any, hash: any) => {
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

            input.parse();
            return [];
        } catch (exception) {
            return filter(this.suggestions, prompt.lastArgument, {key: 'value', maxResults: 30});
        }
    }
}
