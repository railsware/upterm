import {Weight, Brightness} from "./Enums";
import {Stats} from "fs";
import {ReactElement} from "react";
import {Job} from "./shell/Job";
import {Session} from "./shell/Session";
import {Suggestion} from "./plugins/autocompletion_utils/Common";
import {Output} from "./Output";
import {Environment} from "./shell/Environment";
import {OrderedSet} from "./utils/OrderedSet";
import {Argument} from "./shell/Parser";
import {Aliases} from "./shell/Aliases";

export type ColorCode = number | number[];

export interface Attributes {
    readonly inverse: boolean;
    readonly color: ColorCode;
    readonly backgroundColor: ColorCode;
    readonly brightness: Brightness;
    readonly weight: Weight;
    readonly underline: boolean;
    readonly crossedOut: boolean;
    readonly blinking: boolean;
    readonly cursor: boolean;
}

export interface PreliminaryAutocompletionContext {
    readonly environment: Environment;
    readonly historicalPresentDirectoriesStack: OrderedSet<string>;
    readonly aliases: Aliases;
}

export interface AutocompletionContext extends PreliminaryAutocompletionContext {
    readonly argument: Argument;
}

export type AutocompletionProvider = (context: AutocompletionContext) => Promise<Suggestion[]>;

export interface FileInfo {
    name: string;
    stat: Stats;
}

export interface Prettyfier {
    isApplicable: (job: Job) => boolean;
    prettify: (job: Job) => ReactElement<any>;
}

export interface EnvironmentObserverPlugin {
    presentWorkingDirectoryWillChange: (session: Session, directory: string) => void;
    presentWorkingDirectoryDidChange: (session: Session, directory: string) => void;
}

export interface PreexecPlugin {
    (job: Job): Promise<void>;
}

export interface TerminalLikeDevice {
    output: Output;
    write: (input: string | KeyboardEvent) => void;
}

export type UserEvent = KeyboardEvent | ClipboardEvent;
