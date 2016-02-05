import {Color, Weight} from "./Enums";
import {Stats} from "fs";
import {ReactElement} from "react";
import Job from "./Job";
import Terminal from "./Terminal";
import {Suggestion} from "./plugins/autocompletion_providers/Suggestions";

export interface Attributes {
    color?: Color;
    "background-color"?: Color;
    weight?: Weight;
    underline?: boolean;
    crossedOut?: boolean;
    blinking?: boolean;
    cursor?: boolean;
}

// FIXME: rename to contributor.
export interface AutocompletionProvider {
    forCommand?: string;
    getSuggestions(job: Job): Promise<Suggestion[]>;
}

export interface FileInfo {
    name: string;
    stat: Stats;
}

export interface OutputDecorator {
    isApplicable: (job: Job) => boolean;
    decorate: (job: Job) => ReactElement<any>;

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
