import {statsIn, resolveDirectory, directoryName, joinPath} from "../../utils/Common";
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

type Style = { value: string; css: CSSObject};

export class Suggestion {
    protected _value = "";
    private _displayValue = "";
    private _synopsis = "";
    private _description = "";
    private _style = {value: "", css: {}};
    private _shouldAddSpace = false;

    get value(): string {
        return this._value;
    }

    get synopsis(): string {
        return this._synopsis || this.truncatedDescription;
    }

    get description(): string {
        return this._description;
    }

    get style(): Style {
        return this._style;
    }

    get displayValue(): string {
        return this._displayValue || this.value;
    }

    get shouldAddSpace(): boolean {
        return this._shouldAddSpace;
    }

    withValue(value: string): this {
        this._value = value;
        return this;
    }

    withDisplayValue(value: string): this {
        this._displayValue = value;
        return this;
    }

    withSynopsis(synopsis: string): this {
        this._synopsis = synopsis;
        return this;
    }

    withDescription(description: string): this {
        this._description = description;
        return this;
    }

    withStyle(style: Style): this {
        this._style = style;
        return this;
    }

    withSpace(): this {
        this._shouldAddSpace = true;
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
    file: (fileInfo: FileInfo) => {
        return {
            value: extensionIcon(Path.extname(fileInfo.name)),
            css: {},
        };
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

            return new Suggestion().withValue(value).withDescription(description).withStyle(styles.directory);
        });
    }

    const tokenDirectory = directoryName(tokenValue);
    const basePath = tokenValue.slice(tokenDirectory.length);
    const directoryPath = resolveDirectory(directory, tokenDirectory);
    const stats = await statsIn(directoryPath);

    return stats
        .filter(info => info.name.startsWith(".") ? basePath.startsWith(".") : true)
        .filter(info => info.stat.isDirectory() || filter(info))
        .map(info => {
            if (info.stat.isDirectory()) {
                return new Suggestion().withValue(joinPath(tokenDirectory, info.name + Path.sep)).withDisplayValue(info.name + Path.sep).withStyle(styles.directory);
            } else {
                return new Suggestion().withValue(joinPath(tokenDirectory, info.name)).withDisplayValue(info.name).withStyle(styles.file(info));
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
export const directoriesSuggestionsProvider = filesSuggestionsProvider(info => info.stat.isDirectory());

export const environmentVariableSuggestions = mk(context => {
    if (context.argument.value.startsWith("$")) {
        return context.environment.map((key, value) =>
            new Suggestion().withValue("$" + key).withDescription(value).withStyle(styles.environmentVariable)
        );
    } else {
        return [];
    }
});

export const combine = (providers: AutocompletionProvider[]): AutocompletionProvider => async(context: AutocompletionContext): Promise<Suggestion[]> => {
    return _.flatten(await Promise.all(providers.map(provider => provider(context))));
};

export function mk(provider: AutocompletionProvider) {
    return provider;
}

function gitStatusCodeColor(statusCode: StatusCode) {
    switch (statusCode) {
        case StatusCode.Added:
            return colors.green;
        case StatusCode.Copied:
            return colors.blue;
        case StatusCode.Deleted:
            return colors.red;
        case StatusCode.Modified:
            return colors.blue;
        case StatusCode.Renamed:
            return colors.blue;
        case StatusCode.Unmodified:
            return colors.white;
        case StatusCode.Untracked:
            return colors.red;
        case StatusCode.UpdatedButUnmerged:
            return colors.blue;
        default:
            throw "Should never happen.";
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

export const style = (value: Style) => <T extends Suggestion>(suggestion: T) => suggestion.withStyle(value);
export const command = style(styles.command);

export const longAndShortFlag = (name: string, shortName = name[0]) => mk(context => {
    const longValue = `--${name}`;
    const shortValue = `-${shortName}`;

    if (context.argument.command.hasArgument(longValue, context.argument) || context.argument.command.hasArgument(shortValue, context.argument)) {
        return [];
    }

    const value = context.argument.value === shortValue ? shortValue : longValue;

    return [new Suggestion().withValue(value).withDisplayValue(`${shortValue} ${longValue}`).withStyle(styles.option)];
});

export const shortFlag = (char: string) => unique(() => [new Suggestion().withValue(`-${char}`).withStyle(styles.option)]);
export const longFlag = (name: string) => unique(() => [new Suggestion().withValue(`--${name}`).withStyle(styles.option)]);

export const mapSuggestions = (provider: AutocompletionProvider, mapper: (suggestion: Suggestion) => Suggestion) => mk(async(context) => (await provider(context)).map(mapper));
