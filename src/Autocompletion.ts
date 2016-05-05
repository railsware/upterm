import * as _ from "lodash";
import * as i from "./Interfaces";
import Job from "./Job";
import {choice, token, executable, decorate, sequence, spacesWithoutSuggestion} from "./Parser";
import {commandDescriptions} from "./plugins/autocompletion_providers/Executable";
import {git} from "./plugins/autocompletion_providers/Git";
import {description} from "./plugins/autocompletion_providers/Suggestions";
import {cd} from "./plugins/autocompletion_providers/Cd";

const ls = executable("ls");
const exec = choice(_.map(commandDescriptions, (value, key) =>
    decorate(executable(key), description(value))
));
const command = choice([
    ls,
    git,
    cd,
]);
const sudo = sequence(token("sudo"), command);
const anyCommand = choice([
    sudo,
    command,
    exec,
]);
const separator = choice([
    sequence(spacesWithoutSuggestion, token("&&")),
    sequence(spacesWithoutSuggestion, token(";")),
]);

const grammar = sequence(sequence(anyCommand, separator), anyCommand);

export default class Autocompletion implements i.AutocompletionProvider {
    static limit = 9;

    async getSuggestions(job: Job) {
        if (window.DEBUG) {
            /* tslint:disable:no-console */
            console.time(`suggestion for '${job.prompt.value}'`);
        }

        const results = await grammar(job.prompt.value, {directory: job.session.directory});
        const suggestions = results.map(result => result.suggestions.map(suggestion => suggestion.withPrefix(result.parse)));
        const unique = _.uniqBy(_.flatten(suggestions), suggestion => suggestion.value).slice(0, Autocompletion.limit);

        if (window.DEBUG) {
            /* tslint:disable:no-console */
            console.timeEnd(`suggestion for '${job.prompt.value}'`);
        }

        return unique;
    }
}
