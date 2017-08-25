import {io, resolveDirectory, directoryName, escapeFilePath, userFriendlyPath} from "../../utils/Common";
import {
    FileInfo, AutocompletionContext, AutocompletionProvider,
} from "../../Interfaces";
import * as modeToPermissions from "mode-to-permissions";
import * as Path from "path";
import * as _ from "lodash";

export interface Suggestion {
    label: string;
    detail?: string;
}

export function provide(provider: AutocompletionProvider): AutocompletionProvider {
    return provider;
}

export const unique = (provider: AutocompletionProvider) => provide(async context => {
    const suggestions = await provider(context);
    return suggestions.filter(suggestion => !context.argument.command.hasArgument(suggestion.label, context.argument));
});

const filesSuggestions = (filter: (info: FileInfo) => boolean) => async (tokenValue: string, directory: string): Promise<Suggestion[]> => {
    const parentDirectory = userFriendlyPath(directory.replace(/\/$/, "").split(Path.sep).slice(0, -1).join(Path.sep));
    const suggestions = [{label: "../", detail: parentDirectory}];

    const tokenDirectory = directoryName(tokenValue);
    const basePath = tokenValue.slice(tokenDirectory.length);
    const directoryPath = resolveDirectory(directory, tokenDirectory);
    const stats = await io.lstatsIn(directoryPath);

    return stats
        .filter(info => info.name.startsWith(".") ? basePath.startsWith(".") : true)
        .filter(info => info.stat.isDirectory() || filter(info))
        .map(info => {
            const escapedName: string = escapeFilePath(info.name);

            if (info.stat.isDirectory()) {
                return {label: escapedName + "/"};
            } else {
                return {label: escapedName};
            }
        }).concat(suggestions);
};

const filesSuggestionsProvider =
    (filter: (info: FileInfo) => boolean) =>
        (context: AutocompletionContext, directory = context.environment.pwd): Promise<Suggestion[]> =>
            filesSuggestions(filter)(context.argument.value, directory);

export const executableFilesSuggestions = filesSuggestions(info => info.stat.isFile() && modeToPermissions(info.stat.mode).execute.owner);
export const anyFilesSuggestions = filesSuggestions(() => true);
export const anyFilesSuggestionsProvider = unique(filesSuggestionsProvider(() => true));
export const directoriesSuggestions = filesSuggestions(info => info.stat.isDirectory());
export const directoriesSuggestionsProvider = filesSuggestionsProvider(info => info.stat.isDirectory());

export const environmentVariableSuggestions = provide(async context => {
    if (context.argument.value.startsWith("$")) {
        return context.environment.map((key, value) =>
            ({label: "$" + key, detail: value}),
        );
    } else {
        return [];
    }
});

export function contextIndependent(provider: () => Promise<Suggestion[]>) {
    return _.memoize(provider, () => "");
}

export const emptyProvider = provide(async() => []);

export const longAndShortFlag = (name: string, shortName = name[0]) => provide(async context => {
    const longValue = `--${name}`;
    const shortValue = `-${shortName}`;

    if (context.argument.command.hasArgument(longValue, context.argument) || context.argument.command.hasArgument(shortValue, context.argument)) {
        return [];
    }

    const value = context.argument.value === shortValue ? shortValue : longValue;

    return [{label: value}];
});

export const shortFlag = (char: string) => unique(async() => [{label: `-${char}`}]);
export const longFlag = (name: string) => unique(async() => [{label: `--${name}`}]);

export const mapSuggestions = (provider: AutocompletionProvider, mapper: (suggestion: Suggestion) => Suggestion) => provide(async context => (await provider(context)).map(mapper));

export interface SubcommandConfig {
    name: string;
    detail?: string;
    provider?: AutocompletionProvider;
}

export const commandWithSubcommands = (subCommands: SubcommandConfig[]) => {
    return async (context: AutocompletionContext) => {
        if (context.argument.position === 1) {
            return subCommands.map(({ name, detail, provider }) => ({
                label: name,
                detail,
                space: provider !== undefined,
            }));
        } else if (context.argument.position === 2) {
            const firstArgument = context.argument.command.nthArgument(1);
            if (firstArgument) {
                const subCommandConfig = subCommands.find(config => config.name === firstArgument.value);
                if (subCommandConfig && subCommandConfig.provider) {
                    return await subCommandConfig.provider(context);
                }
            }
        }
        return [];
    };
};

export const combineShortFlags = (suggestionsProvider: AutocompletionProvider) => {
    return async (context: AutocompletionContext) => {
        const token = context.argument.value;
        const reShortFlag = new RegExp(/^\-[a-zA-Z]$/);
        const reShortFlags = new RegExp(/^\-[a-zA-Z]+$/);
        const suggestions = await suggestionsProvider(context);
        if (reShortFlags.test(token)) {
            return suggestions
                    .filter(s =>
                        reShortFlag.test(s.label) && !token.includes(s.label.slice(1)))
                    .map(s =>
                        ({
                            label: token + s.label.slice(1),
                            detail: s.detail,
                        }));
        } else {
            return suggestions;
        }
    };
};
