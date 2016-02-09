import {FileInfo} from "../../Interfaces";
import Utils from "../../Utils";
import Job from "../../Job";
import * as Path from "path";
import {Color} from "../../Enums";

type SuggestionsPromise = Promise<Suggestion[]>;

export class Suggestion {
    protected _value: string;
    private _synopsis: string;
    private _description: string;
    private _type: string;
    private _childrenProvider: (job: Job) => SuggestionsPromise;

    constructor() {
        this._value = "";
        this._synopsis = "";
        this._description = "";
        this._type = "";
        this._childrenProvider = async (job) => [];
    }

    get value(): string {
        return this._value;
    }

    get synopsis(): string {
        return this._synopsis || this.truncatedDescription;
    }

    get description(): string {
        return this._description;
    }

    get type(): string {
        return this._type;
    }

    get iconColor(): Color {
        return Color.White;
    }

    get partial(): boolean {
        return false;
    }

    get displayValue(): string {
        return this.value;
    }

    getPrefix(job: Job): string {
        return job.prompt.lastLexeme;
    }

    shouldIgnore(job: Job): boolean {
        return job.prompt.expandedFinishedLexemes.includes(this.value);
    }

    shouldSuggestChildren(job: Job): boolean {
        return false;
    }

    async getChildren(job: Job): Promise<Suggestion[]> {
        return [];
    }

    withValue(value: string): Suggestion {
        this._value = value;
        return this;
    }

    withSynopsis(synopsis: string): Suggestion {
        this._synopsis = synopsis;
        return this;
    }

    withDescription(description: string): Suggestion {
        this._description = description;
        return this;
    }

    withType(type: string): Suggestion {
        this._type = type;
        return this;
    }

    withChildrenProvider(provider: (job: Job) => SuggestionsPromise): Suggestion {
        this._childrenProvider = provider;
        return this;
    }

    private get truncatedDescription(): string {
        return _.truncate(this.description, { length: 50, separator: " " });
    }
}

abstract class BaseOption extends Suggestion {
    get type() {
        return "option";
    }
}

export class Option extends BaseOption {
    private _alias: string;
    constructor(protected _name: string) {
        super();
    };

    get value() {
        return `--${this._name}`;
    }

    get displayValue() {
        return `${this.alias} ${this.value}`;
    }

    shouldIgnore(job: Job): boolean {
        const finishedWords = job.prompt.expandedFinishedLexemes;
        return finishedWords.includes(this.value) || finishedWords.includes(this.alias);
    }

    private get alias(): string {
        return `-${this._alias || this._name[0]}`;
    }

    withAlias(alias: string): Option {
        this._alias = alias;
        return this;
    }
}

export class LongOption extends BaseOption {
    constructor(protected _name: string) {
        super();
    };

    get value() {
        return `--${this._name}`;
    }
}

export class ShortOption extends BaseOption {
    constructor(protected _name: string) {
        super();
    };

    get value() {
        return `-${this._name}`;
    }
}

export class OptionWithValue extends BaseOption {
    constructor(value: string, protected _displayValue: string) {
        super();
        this.withValue(value);
    };

    get value() {
        return `--${this._value}=`;
    }

    get displayValue() {
        return this._displayValue;
    }

    get partial(): boolean {
        return true;
    }

    shouldIgnore(job: Job): boolean {
        return job.prompt.expanded.some(word => word.includes(this.value));
    }

    shouldSuggestChildren(job: Job): boolean {
        return job.prompt.lastLexeme.includes(this.value);
    }
}

export class Executable extends Suggestion {
    constructor(protected _name: string) {
        super();
    };

    get value() {
        return this._name;
    }

    get displayValue() {
        return this._name;
    }

    get type() {
        return "executable";
    }
}

export class File extends Suggestion {
    constructor(protected _info: FileInfo, protected relativeSearchDirectory: string) {
        super();
    };

    get value() {
        return this.escape(Path.join(this.relativeSearchDirectory, this.unescapedFileName));
    }

    get displayValue() {
        return this.unescapedFileName;
    }

    get type() {
        return ["file", this.extension].join(" ");
    }

    get partial() {
        return this._info.stat.isDirectory();
    }

    get info(): FileInfo {
        return this._info;
    }

    private escape(path: string): string {
        return path.replace(/\s/g, "\\ ");
    }

    private get unescapedFileName(): string {
        if (this._info.stat.isDirectory()) {
            return Utils.normalizeDir(this._info.name);
        } else {
            return this._info.name;
        }
    }

    private get extension(): string {
        if (this._info.stat.isDirectory()) {
            return "directory";
        }

        let extension = Path.extname(this.unescapedFileName);
        if (extension) {
            return extension.slice(1);
        } else {
            return "unknown";
        }
    }
}

export class Subcommand extends Suggestion {
    constructor(protected _name: string) {
        super();
    }

    get value(): string {
        return this._name;
    }

    get type(): string {
        return "command";
    }

    shouldIgnore(job: Job): boolean {
        return job.prompt.expanded.length !== 2;
    }
}

export class SubSubcommand extends Subcommand {
    shouldIgnore(job: Job): boolean {
        return job.prompt.expanded.length !== 3;
    }
}

export async function fileSuggestions(job: Job): Promise<File[]> {
    const prompt = job.prompt;

    if (!prompt.arguments.length) {
        return [];
    }

    const relativeSearchDirectory = Utils.dirName(prompt.lastArgument);
    const fileInfos = await Utils.stats(Utils.resolveDirectory(job.session.currentDirectory, relativeSearchDirectory));

    return fileInfos.map(fileInfo => new File(fileInfo, relativeSearchDirectory));
}
