import {Weight, Brightness} from "./Enums";
import {Stats} from "fs";
import {ReactElement} from "react";
import {Job} from "./Job";
import {Session} from "./Session";
import {Suggestion} from "./plugins/autocompletion_providers/Suggestions";
import {ScreenBuffer} from "./ScreenBuffer";
import {Environment} from "./Environment";
import {OrderedSet} from "./utils/OrderedSet";
import {Argument} from "./shell/Parser";
import {Aliases} from "./Aliases";

export type ColorCode = number | number[];

export interface Attributes {
    inverse?: boolean;
    color?: ColorCode;
    backgroundColor?: ColorCode;
    brightness?: Brightness;
    weight?: Weight;
    underline?: boolean;
    crossedOut?: boolean;
    blinking?: boolean;
    cursor?: boolean;
}

export interface PreliminarySuggestionContext {
    readonly environment: Environment;
    readonly historicalCurrentDirectoriesStack: OrderedSet<string>;
    readonly aliases: Aliases;
}

export interface SuggestionContext extends PreliminarySuggestionContext {
    readonly argument: Argument;
}

export type DynamicAutocompletionProvider = (context: SuggestionContext) => Promise<Suggestion[]>;
export type StaticAutocompletionProvider = Suggestion[];
export type AutocompletionProvider = DynamicAutocompletionProvider | StaticAutocompletionProvider;

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
    currentWorkingDirectoryWillChange: (session: Session, directory: string) => void;
    currentWorkingDirectoryDidChange: (session: Session, directory: string) => void;
}

export interface PreexecPlugin {
    (job: Job): Promise<void>;
}

export interface TerminalLikeDevice {
    screenBuffer: ScreenBuffer;
    dimensions: Dimensions;
    write: (input: string | KeyboardEvent) => void;
}
