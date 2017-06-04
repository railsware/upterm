import {io, resolveDirectory, directoryName, joinPath, isImage, escapeFilePath} from "../../utils/Common";
import {
    FileInfo, AutocompletionContext, AutocompletionProvider,
} from "../../Interfaces";
import * as modeToPermissions from "mode-to-permissions";
import * as Path from "path";
import * as _ from "lodash";
import {fontAwesome} from "../../views/css/FontAwesome";
import {colors} from "../../views/css/colors";
import {CSSObject} from "../../views/css/definitions";
import {StatusCode} from "../../utils/Git";
import {ASTNode, leafNodeAt, serializeReplacing} from "../../shell/Parser";

type Style = { value: string; css: CSSObject};

interface PromptSerializerContext {
    ast: ASTNode;
    caretPosition: number;
    suggestion: Suggestion;
}

type PromptSerializer = (context: PromptSerializerContext) => string;

interface SuggestionAttributes {
    value: string;
    displayValue: string;
    synopsis: string;
    description: string;
    style: Style;
    space: boolean;
    promptSerializer: PromptSerializer;
}

const defaultPromptSerializer: PromptSerializer = (context: PromptSerializerContext): string => {
    const node = leafNodeAt(context.caretPosition, context.ast);
    return serializeReplacing(context.ast, node, context.suggestion.value.replace(/\s/g, "\\ ") + (context.suggestion.shouldAddSpace ? " " : ""));
};

export const noEscapeSpacesPromptSerializer: PromptSerializer = (context: PromptSerializerContext): string => {
    const node = leafNodeAt(context.caretPosition, context.ast);
    return serializeReplacing(context.ast, node, context.suggestion.value + (context.suggestion.shouldAddSpace ? " " : ""));
};

export const replaceAllPromptSerializer: PromptSerializer = (context: PromptSerializerContext) =>  context.suggestion.value;

export class Suggestion {
    constructor(private attributes: Partial<SuggestionAttributes> = {}) {
        this.attributes = attributes;
    }

    get value(): string {
        return this.attributes.value || "";
    }

    get synopsis(): string {
        return this.attributes.synopsis || this.truncatedDescription;
    }

    get description(): string {
        return this.attributes.description || "";
    }

    get style(): Style {
        return this.attributes.style || {value: "", css: {}};
    }

    get displayValue(): string {
        return this.attributes.displayValue || this.value;
    }

    get promptSerializer(): PromptSerializer {
        return this.attributes.promptSerializer || defaultPromptSerializer;
    }

    get shouldAddSpace(): boolean {
        return this.attributes.space || false;
    }

    withSynopsis(synopsis: string): this {
        this.attributes.synopsis = synopsis;
        return this;
    }

    withDescription(description: string): this {
        this.attributes.description = description;
        return this;
    }

    withSpace(): this {
        this.attributes.space = true;
        return this;
    }

    private get truncatedDescription(): string {
        return _.truncate(this.description, {length: 50, separator: " "});
    }
}

export const styles = {
    executable: {
        value: fontAwesome.asterisk,
        css: {
            color: colors.green,
        },
    },
    command: {
        value: fontAwesome.terminal,
        css: {
            color: colors.green,
        },
    },
    option: {
        value: fontAwesome.flagO,
        css: {
            color: colors.green,
        },
    },
    optionValue: {
        value: "=",
        css: {
            color: colors.green,
        },
    },
    environmentVariable: {
        value: fontAwesome.usd,
        css: {
            color: colors.yellow,
        },
    },
    branch: {
        value: fontAwesome.codeFork,
        css: {},
    },
    directory: {
        value: fontAwesome.folder,
        css: {},
    },
    file: (fileInfo: FileInfo, fullPath: string): Style => {
        const extension = Path.extname(fileInfo.name);

        if (isImage(extension)) {
            return {
                value: "",
                css: {
                    backgroundImage: `url("${fullPath}")`,
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                },
            };
        } else {
            return {
                value: extensionIcon(extension),
                css: {},
            };
        }
    },
    gitFileStatus: (statusCode: StatusCode) => ({
        value: fontAwesome.file,
        css: {
            color: gitStatusCodeColor(statusCode),
        },
    }),
    alias: {
        value: fontAwesome.at,
        css: {
            color: colors.yellow,
        },
    },
    func: {
        value: "f",
        css: {
            color: colors.green,
            fontStyle: "italic",
        },
    },
    history: {
        value: fontAwesome.history,
        css: {
            color: colors.blue,
        },
    },
};

export const unique = (provider: AutocompletionProvider): AutocompletionProvider => mk(async (context) => {
    const suggestions = await provider(context);
    return suggestions.filter(suggestion => !context.argument.command.hasArgument(suggestion.value, context.argument));
});

const filesSuggestions = (filter: (info: FileInfo) => boolean) => async(tokenValue: string, directory: string): Promise<Suggestion[]> => {
    /**
     * Parent folders.
     */
    if (tokenValue.endsWith("..")) {
        const pwdParts = directory.replace(/\/$/, "").split(Path.sep);

        return _.range(1, pwdParts.length).map(numberOfParts => {
            const value = `..${Path.sep}`.repeat(numberOfParts);
            const description = pwdParts.slice(0, -numberOfParts).join(Path.sep) || Path.sep;

            return new Suggestion({value: value, description: description, style: styles.directory});
        });
    }

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
                return new Suggestion({
                    value: joinPath(tokenDirectory, escapedName + Path.sep),
                    displayValue: info.name + Path.sep,
                    style: styles.directory,
                    promptSerializer: noEscapeSpacesPromptSerializer,
                });
            } else {
                return new Suggestion({
                    value: joinPath(tokenDirectory, escapedName),
                    displayValue: info.name,
                    style: styles.file(info, joinPath(directoryPath, escapedName)),
                    promptSerializer: noEscapeSpacesPromptSerializer,
                });
            }
        });
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

export const environmentVariableSuggestions = mk(async context => {
    if (context.argument.value.startsWith("$")) {
        return context.environment.map((key, value) =>
            new Suggestion({value: "$" + key, description: value, style: styles.environmentVariable}),
        );
    } else {
        return [];
    }
});

export function contextIndependent(provider: () => Promise<Suggestion[]>) {
    return _.memoize(provider, () => "");
}

export function mk(provider: AutocompletionProvider) {
    return provider;
}

export const emptyProvider = mk(async() => []);



function gitStatusCodeColor(statusCode: StatusCode) {
    switch (statusCode) {
        case "StagedModified":
        case "StagedAdded":
        case "StagedDeleted":
        case "StagedRenamed":
        case "StagedCopied":
            return colors.green;

        case "StagedCopiedUnstagedModified":
        case "StagedCopiedUnstagedDeleted":
        case "StagedRenamedUnstagedModified":
        case "StagedRenamedUnstagedDeleted":
        case "StagedDeletedUnstagedModified":
        case "StagedAddedUnstagedModified":
        case "StagedAddedUnstagedDeleted":
        case "StagedModifiedUnstagedModified":
        case "StagedModifiedUnstagedDeleted":
            return colors.blue;

        case "UnstagedDeleted":
        case "UnstagedModified":
        case "UnmergedBothDeleted":
        case "UnmergedAddedByUs":
        case "UnmergedDeletedByThem":
        case "UnmergedAddedByThem":
        case "UnmergedDeletedByUs":
        case "UnmergedBothAdded":
        case "UnmergedBothModified":
        case "Untracked":
        case "Ignored":
        case "Invalid":
            return colors.red;

        case "Unmodified":
            return colors.white;
        default:
            console.error(`Unhandled git status code: ${statusCode}`);
            return colors.white;
    }
}

function extensionIcon(extension: string) {
    switch (extension) {
        case ".zip":
        case ".gzip":
            return fontAwesome.fileArchiveO;
        case ".js":
        case ".ts":
        case ".rb":
        case ".json":
            return fontAwesome.fileCodeO;
        default:
            return fontAwesome.file;
    }
}

export const longAndShortFlag = (name: string, shortName = name[0]) => mk(async context => {
    const longValue = `--${name}`;
    const shortValue = `-${shortName}`;

    if (context.argument.command.hasArgument(longValue, context.argument) || context.argument.command.hasArgument(shortValue, context.argument)) {
        return [];
    }

    const value = context.argument.value === shortValue ? shortValue : longValue;

    return [new Suggestion({value: value, displayValue: `${shortValue} ${longValue}`, style: styles.option})];
});

export const shortFlag = (char: string) => unique(async() => [new Suggestion({value: `-${char}`, style: styles.option})]);
export const longFlag = (name: string) => unique(async() => [new Suggestion({value: `--${name}`, style: styles.option})]);

export const mapSuggestions = (provider: AutocompletionProvider, mapper: (suggestion: Suggestion) => Suggestion) => mk(async(context) => (await provider(context)).map(mapper));

export interface SubcommandConfig {
    name: string;
    description?: string;
    synopsis?: string;
    style?: Style;
    provider?: AutocompletionProvider;
}

export const commandWithSubcommands = (subCommands: SubcommandConfig[]) => {
    return async (context: AutocompletionContext) => {
        if (context.argument.position === 1) {
            return subCommands.map(({ name, description, synopsis, provider, style }) => new Suggestion({
                value: name,
                description,
                synopsis,
                style: style || styles.command,
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
                        reShortFlag.test(s.value) && !token.includes(s.value.slice(1))
                            && s.withSpace)
                    .map(s =>
                        new Suggestion({value: token + s.value.slice(1),
                            displayValue: s.displayValue, description: s.description,
                            style: s.style}));
        } else {
            return suggestions;
        }
    };
};
