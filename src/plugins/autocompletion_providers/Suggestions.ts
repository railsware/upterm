import {Suggestion, FileInfo} from "../../Interfaces";
import Utils from "../../Utils";
import Job from "../../Job";
import * as Path from "path";

abstract class BaseOption extends Suggestion {
    get type() {
        return "option";
    }
}

export class Option extends BaseOption {
    constructor(protected _name: string, protected _synopsis: string, protected _description: string) {
        super();
    };

    get value() {
        return `--${this._name}`;
    }

    get displayValue() {
        return `-${this._name[0]} ${this.value}`;
    }

    get description() {
        return this._description;
    }

    get synopsis() {
        return this._synopsis;
    }
}

export class ShortOption extends BaseOption {
    constructor(protected _name: string, protected _synopsis: string, protected _description: string) {
        super();
    };

    get value() {
        return `-${this._name}`;
    }

    get description() {
        return this._description;
    }

    get synopsis() {
        return this._synopsis;
    }
}

export class Executable extends Suggestion {
    constructor(protected _name: string, protected _description: string) {
        super();
    };

    get value() {
        return this._name;
    }

    get displayValue() {
        return this._name;
    }

    get description() {
        return this._description;
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
    constructor(protected _name: string, protected _synopsis: string) {
        super();
    }

    get value(): string {
        return this._name;
    }

    get synopsis(): string {
        return this._synopsis;
    }

    get type(): string {
        return "command";
    }
}

export function toSubcommands(dictionary: Dictionary<string>) {
    return _.map(dictionary, (value: string, key: string) => new Subcommand(key, value));
}
