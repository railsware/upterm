import * as e from "./Enums";
import * as fs from "fs";
import * as React from "react";
import Job from "./Job";
import Terminal from "./Terminal";

export interface Attributes {
    color?: e.Color;
    "background-color"?: e.Color;
    weight?: e.Weight;
    underline?: boolean;
    crossedOut?: boolean;
    blinking?: boolean;
    cursor?: boolean;
}

export interface AutocompletionProvider {
    forCommand?: string;
    getSuggestions(job: Job): Promise<Suggestion[]>;
}

// FIXME: move to another file.
export class Suggestion {
    get value(): string {
        return "";
    }

    get synopsis(): string {
        return "";
    }

    get description(): string {
        return "";
    }

    // FIXME: return an enum or an icon.
    get type(): string {
        return "";
    }

    // FIXME: remove.
    get color(): e.Color {
        return e.Color.White;
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

    isAlreadyOnPrompt(job: Job): boolean {
        return job.prompt.expanded.includes(this.value);
    }
}

export interface FileInfo {
    name: string;
    stat: fs.Stats;
}

export interface OutputDecorator {
    isApplicable: (job: Job) => boolean;
    decorate: (job: Job) => React.ReactElement<any>;

    /**
     * @note Setting this property to `true` will result in rendering performance
     *       decrease because the output will be re-decorated after each data chunk.
     */
    shouldDecorateRunningPrograms?: boolean;
}

export interface EnvironmentObserverPlugin {
    currentWorkingDirectoryWillChange: (terminal: Terminal, directory: string) => void;
    currentWorkingDirectoryDidChange: (terminal: Terminal, directory: string) => void;
}

export interface PreexecPlugin {
    (job: Job): Promise<void>;
}
