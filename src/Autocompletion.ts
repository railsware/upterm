import * as _ from "lodash";
import {Job} from "./Job";
import {
    choice, token, executable, decorate, sequence, string, many1,
    noisySuggestions, Parser, optional, Context,
} from "./shell/Parser";
import {commandDescriptions} from "./plugins/autocompletion_providers/Executable";
import {description} from "./plugins/autocompletion_providers/Suggestions";
import {makeAlias} from "./plugins/autocompletion_providers/Alias";
import {relativeFilePath} from "./plugins/autocompletion_providers/File";
import {mapObject} from "./utils/Common";
import {command} from "./plugins/autocompletion_providers/Command";
import {redirect} from "./plugins/autocompletion_providers/Redirect";
import {environmentVariable} from "./plugins/autocompletion_providers/EnvironmentVariable";
import {leafNodeAt} from "./shell/Parser2";

export const makeGrammar = (aliases: Dictionary<string>) => {
    const exec = sequence(
        choice(mapObject(commandDescriptions, (key, value) => decorate(executable(key), description(value)))),
        optional(many1(
            choice([
                relativeFilePath,
                environmentVariable,
            ])
        ))
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
        noisySuggestions(token(string("&&"))),
        noisySuggestions(token(string(";"))),
    ]);

    return sequence(sequence(anyCommand, separator), anyCommand);
};

export const suggestionsLimit = 9;

export const {getSuggestions} = new class {
    private grammar: Parser;

    // getSuggestions = async (job: Job) => {
    //     if (!this.grammar) {
    //         this.grammar = makeGrammar(job.session.aliases.toObject());
    //     }
    //
    //     if (window.DEBUG) {
    //         /* tslint:disable:no-console */
    //         console.time(`suggestion for '${job.prompt.value}'`);
    //     }
    //
    //     const results = await this.grammar(new Context(
    //         job.prompt.tokens,
    //         job.session.directory,
    //         job.session.historicalCurrentDirectoriesStack,
    //         job.environment
    //     ));
    //
    //     const suggestions = results.map(result => result.suggestions.map(suggestion => suggestion.withPrefix(result.parse.map(token => token.raw).join(""))));
    //     const unique = _.uniqBy(_.flatten(suggestions), suggestion => suggestion.value).slice(0, suggestionsLimit);
    //
    //     if (window.DEBUG) {
    //         /* tslint:disable:no-console */
    //         console.timeEnd(`suggestion for '${job.prompt.value}'`);
    //     }
    //
    //     return unique;
    // };

    getSuggestions = async (job: Job) => {
        const node = leafNodeAt(job.prompt.value.length, job.prompt.ast);
        const suggestions = await node.suggestions();

        return suggestions.filter(suggestion => suggestion.value.startsWith(node.value)).slice(0, suggestionsLimit);
    };
};
