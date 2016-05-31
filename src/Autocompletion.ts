import * as _ from "lodash";
import Job from "./Job";
import {
    choice, token, executable, decorate, sequence, string, many1,
    optionalContinuation, spacesWithoutSuggestion, many, noisySuggestions, InputMethod, Parser,
} from "./Parser";
import {commandDescriptions} from "./plugins/autocompletion_providers/Executable";
import {description, style, styles} from "./plugins/autocompletion_providers/Suggestions";
import {makeAlias} from "./plugins/autocompletion_providers/Alias";
import {relativeFilePath} from "./plugins/autocompletion_providers/File";
import {compose, mapObject} from "./utils/Common";
import {command} from "./plugins/autocompletion_providers/Command";
import Aliases from "./Aliases";
import {redirect} from "./plugins/autocompletion_providers/Redirect";
import {environmentVariable} from "./plugins/autocompletion_providers/EnvironmentVariable";

export const makeGrammar = (aliases: Dictionary<string>) => {
    const exec = sequence(
        choice(mapObject(commandDescriptions, (key, value) => decorate(string(key), compose(description(value), style(styles.executable))))),
        optionalContinuation(many1(choice([relativeFilePath, environmentVariable])))
    );

    const sudo = sequence(executable("sudo"), command);
    const anyCommand = sequence(
        choice([
            sudo,
            command,
            exec,
            makeAlias(aliases),
        ]),
        redirect
    );
    const separator = choice([
        noisySuggestions(sequence(many(spacesWithoutSuggestion), token(string("&&")))),
        noisySuggestions(sequence(many(spacesWithoutSuggestion), token(string(";")))),
    ]);

    return sequence(sequence(anyCommand, separator), anyCommand);
};

export const suggestionsLimit = 9;

export const {getSuggestions} = new class {
    private grammar: Parser;

    getSuggestions = async (job: Job, inputMethod: InputMethod) => {
        if (!this.grammar) {
            const aliases = await Aliases.all();
            this.grammar = makeGrammar(aliases);
        }

        if (window.DEBUG) {
            /* tslint:disable:no-console */
            console.time(`suggestion for '${job.prompt.value}'`);
        }

        const results = await this.grammar({
            input: job.prompt.value,
            directory: job.session.directory,
            historicalCurrentDirectoriesStack: job.session.historicalCurrentDirectoriesStack,
            environment: job.environment,
            inputMethod: inputMethod,
        });

        const suggestions = results.map(result => result.suggestions.map(suggestion => suggestion.withPrefix(result.parse)));
        const unique = _.uniqBy(_.flatten(suggestions), suggestion => suggestion.value).slice(0, suggestionsLimit);

        if (window.DEBUG) {
            /* tslint:disable:no-console */
            console.timeEnd(`suggestion for '${job.prompt.value}'`);
        }

        return unique;
    };
};
