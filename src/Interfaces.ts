import {Weight, Brightness} from "./Enums";
import {Stats} from "fs";
import {ReactElement} from "react";
import {Job} from "./shell/Job";
import {Session} from "./shell/Session";
import {Suggestion} from "./plugins/autocompletion_providers/Common";
import {ScreenBuffer} from "./ScreenBuffer";
import {Environment} from "./shell/Environment";
import {OrderedSet} from "./utils/OrderedSet";
import {Argument} from "./shell/Parser";
import {Aliases} from "./shell/Aliases";

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

export interface PreliminaryAutocompletionContext {
    readonly environment: Environment;
    readonly historicalPresentDirectoriesStack: OrderedSet<string>;
    readonly aliases: Aliases;
}

export interface AutocompletionContext extends PreliminaryAutocompletionContext {
    readonly argument: Argument;
}

export type AutocompletionProvider = (context: AutocompletionContext) => Suggestion[] | Promise<Suggestion[]>;

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
    presentWorkingDirectoryWillChange: (session: Session, directory: string) => void;
    presentWorkingDirectoryDidChange: (session: Session, directory: string) => void;
}

export interface PreexecPlugin {
    (job: Job): Promise<void>;
}

export interface TerminalLikeDevice {
    screenBuffer: ScreenBuffer;
    dimensions: Dimensions;
    write: (input: string | KeyboardEvent) => void;
}
