import * as _ from "lodash";
import * as i from "./Interfaces";
import Job from "./Job";
import {choice, token, executable} from "./Parser";
import {commandDescriptions} from "./plugins/autocompletion_providers/Executable";
import {git} from "./plugins/autocompletion_providers/Git";
import {description} from "./plugins/autocompletion_providers/Suggestions";

const ls = executable("ls");
const exec = choice(_.map(commandDescriptions, (value, key) =>
    executable(key).decorate(description(value))
));
const command = choice([
    ls,
    git,
]);
const sudo = token("sudo").bind(command);
const anyCommand = choice([
    sudo,
    command,
    exec,
]);
const separator = choice([
    token("&&"),
    token(";"),
]);

const grammar = anyCommand.bind(separator).bind(anyCommand);

export default class Autocompletion implements i.AutocompletionProvider {
    static limit = 9;

    async getSuggestions(job: Job) {
        if (window.DEBUG) {
            /* tslint:disable:no-console */
            console.time(`suggestion for '${job.prompt.value}'`);
        }

        const result = await grammar.derive(job.prompt.value, job.session);
        const suggestions = await result.parser.suggestions(job.session);
        const unique = _.uniqBy(suggestions, suggestion => suggestion.value).slice(0, Autocompletion.limit);

        if (window.DEBUG) {
            /* tslint:disable:no-console */
            console.timeEnd(`suggestion for '${job.prompt.value}'`);
        }

        return unique;
    }
}
