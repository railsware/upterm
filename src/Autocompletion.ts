import * as _ from "lodash";
import Job from "./Job";
import {
    choice, token, executable, decorate, sequence, string, many1,
    optionalContinuation, spacesWithoutSuggestion, many, noisySuggestions, InputMethod,
} from "./Parser";
import {commandDescriptions} from "./plugins/autocompletion_providers/Executable";
import {git} from "./plugins/autocompletion_providers/Git";
import {description, type} from "./plugins/autocompletion_providers/Suggestions";
import {cd} from "./plugins/autocompletion_providers/Cd";
import {alias} from "./plugins/autocompletion_providers/Alias";
import {file} from "./plugins/autocompletion_providers/File";
import {npm} from "./plugins/autocompletion_providers/NPM";
import {rails} from "./plugins/autocompletion_providers/Rails";
import {compose} from "./utils/Common";

const ls = executable("ls");
const exec = sequence(
    choice(_.map(commandDescriptions, (value, key) => decorate(string(key), compose(description(value), type("executable"))))),
    optionalContinuation(many1(file))
);

export const command = choice([
    ls,
    git,
    cd,
    npm,
    rails,
]);

const sudo = sequence(executable("sudo"), command);
const anyCommand = choice([
    sudo,
    command,
    exec,
    alias,
]);
const separator = choice([
    noisySuggestions(sequence(many(spacesWithoutSuggestion), token(string("&&")))),
    noisySuggestions(sequence(many(spacesWithoutSuggestion), token(string(";")))),
]);

const grammar = sequence(sequence(anyCommand, separator), anyCommand);

const limit = 9;

export async function getSuggestions(job: Job, inputMethod: InputMethod) {
    if (window.DEBUG) {
        /* tslint:disable:no-console */
        console.time(`suggestion for '${job.prompt.value}'`);
    }

    const results = await grammar({
        input: job.prompt.value,
        directory: job.session.directory,
        historicalCurrentDirectoriesStack: job.session.historicalCurrentDirectoriesStack,
        cdpath: job.environment.cdpath(job.session.directory),
        inputMethod: inputMethod,
    });
    const suggestions = results.map(result => result.suggestions.map(suggestion => suggestion.withPrefix(result.parse)));
    const unique = _.uniqBy(_.flatten(suggestions), suggestion => suggestion.value).slice(0, limit);

    if (window.DEBUG) {
        /* tslint:disable:no-console */
        console.timeEnd(`suggestion for '${job.prompt.value}'`);
    }

    return unique;
}
