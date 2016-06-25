import {FileInfo} from "../../Interfaces";
import * as Path from "path";
import * as _ from "lodash";
import {fontAwesome} from "../../views/css/FontAwesome";
import {colors} from "../../views/css/colors";
import {CSSObject} from "../../views/css/main";
import {StatusCode} from "../../utils/Git";

type Style = { value: string; css: CSSObject};

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
        case StatusCode.UpdatedButUnmerged:
            return colors.blue;
        default:
            throw "Should never happen.";
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

export const style = (value: Style) => <T extends Suggestion>(suggestion: T) => suggestion.withStyle(value);
export const command = style(styles.command);
export const description = (value: string) => <T extends Suggestion>(suggestion: T) => suggestion.withDescription(value);

export const longAndShortOption = (name: string, shortName = name[0]) => new Suggestion().withValue(`--${name}`).withDisplayValue(`-${shortName} --${name}`).withStyle(styles.option);
export const shortOption = (char: string) => new Suggestion().withValue(`-${char}`).withStyle(styles.option);
export const longOption = (name: string) => new Suggestion().withValue(`--${name}`).withStyle(styles.option);
