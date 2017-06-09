import * as _ from "lodash";
import * as i from "../Interfaces";
import * as React from "react";
import {Session} from "./Session";
import {ANSIParser} from "../ANSIParser";
import {Prompt} from "./Prompt";
import {ScreenBuffer} from "../ScreenBuffer";
import {CommandExecutor, NonZeroExitCodeError} from "./CommandExecutor";
import {PTY} from "../PTY";
import {PluginManager} from "../PluginManager";
import {EmitterWithUniqueID} from "../EmitterWithUniqueID";
import {Status} from "../Enums";
import {Environment} from "./Environment";
import {normalizeKey} from "../utils/Common";
import {TerminalLikeDevice} from "../Interfaces";
import {History} from "./History";
import {Invalid} from "./Scanner";

function makeThrottledDataEmitter(timesPerSecond: number, subject: EmitterWithUniqueID) {
    return _.throttle(() => subject.emit("data"), 1000 / timesPerSecond);
}

export class Job extends EmitterWithUniqueID implements TerminalLikeDevice {
    public status: Status = Status.InProgress;
    public readonly parser: ANSIParser;
    public interceptionResult: React.ReactElement<any> | undefined;
    private readonly _screenBuffer: ScreenBuffer;
    private readonly rareDataEmitter: Function;
    private readonly frequentDataEmitter: Function;
    private executedWithoutInterceptor: boolean = false;
    private pty: PTY | undefined;

    constructor(private _session: Session, private _prompt: Prompt) {
        super();

        this.rareDataEmitter = makeThrottledDataEmitter(1, this);
        this.frequentDataEmitter = makeThrottledDataEmitter(60, this);

        this._screenBuffer = new ScreenBuffer();
        this._screenBuffer.on("data", this.throttledDataEmitter);
        this.parser = new ANSIParser(this);
    }

    async executeWithoutInterceptor(): Promise<void> {
        if (!this.executedWithoutInterceptor) {
            this.executedWithoutInterceptor = true;
            try {
                await CommandExecutor.execute(this);

                // Need to wipe out PTY so that we
                // don't keep trying to write to it.
                this.pty = undefined;

                // Need to check the status here because it's
                // executed even after the process was interrupted.
                if (this.status === Status.InProgress) {
                    this.setStatus(Status.Success);
                }
                this.emit("end");
            } catch (exception) {
                this.handleError(exception);
            }
        }
    }

    async execute({allowInterception = true} = {}): Promise<void> {
        History.add(this.prompt.value);

        const commandWords: string[] = this.prompt.expandedTokens
            .filter(token => !(token instanceof Invalid))
            .map(token => token.escapedValue);
        const interceptorOptions = {
            command: commandWords,
            presentWorkingDirectory: this.environment.pwd,
        };
        const interceptor = PluginManager.commandInterceptorPlugins.find(
            potentialInterceptor => potentialInterceptor.isApplicable(interceptorOptions),
        );

        await Promise.all(PluginManager.preexecPlugins.map(plugin => plugin(this)));
        if (interceptor && allowInterception) {
            if (!this.interceptionResult) {
                try {
                    this.interceptionResult = await interceptor.intercept(interceptorOptions);
                    this.setStatus(Status.Success);
                } catch (e) {
                    await this.executeWithoutInterceptor();
                }
            }
        } else {
            await this.executeWithoutInterceptor();
        }
        this.emit("end");
    }

    handleError(message: NonZeroExitCodeError | string): void {
        this.setStatus(Status.Failure);
        if (message) {
            if (message instanceof NonZeroExitCodeError) {
                // Do nothing.
            } else {
                this._screenBuffer.writeMany(message);
            }
        }
        this.emit("end");
    }

    isInProgress(): boolean {
        return this.status === Status.InProgress;
    }

    isRunningPty(): boolean {
        return this.pty !== undefined;
    }

    setPty(pty: PTY) {
        this.pty = pty;
    }

    // Writes to the process' STDIN.
    write(input: string|KeyboardEvent) {
        let text: string;

        if (typeof input === "string") {
            text = input;
        } else {
            if (input.ctrlKey) {
                /**
                 * @link https://unix.stackexchange.com/a/158298/201739
                 */
                text = String.fromCharCode(input.keyCode - 64);
            } else if (input.altKey) {
                /**
                 * The alt key can mean two things:
                 *   - send an escape character before special keys such as cursor-keys, or
                 *   - act as an extended shift, allowing you to enter codes for Latin-1 values from 160 to 255.
                 *
                 * We currently don't support the second one since it's less frequently used.
                 * For future reference, the correct extended code would be keyCode + 160.
                 * @link http://invisible-island.net/ncurses/ncurses.faq.html#bash_meta_mode
                 */
                let char = String.fromCharCode(input.keyCode);
                if (input.shiftKey) {
                    char = char.toUpperCase();
                } else {
                    char = char.toLowerCase();
                }
                text = `\x1b${char}`;
            } else {
                text = normalizeKey(input.key, this.screenBuffer.cursorKeysMode);
            }
        }

        (this.pty as PTY).write(text);
    }

    get session(): Session {
        return this._session;
    }

    get dimensions(): Dimensions {
        return this.session.dimensions;
    }

    set dimensions(dimensions: Dimensions) {
        this.session.dimensions = dimensions;
        this.winch();
    }

    hasOutput(): boolean {
        return !this._screenBuffer.isEmpty();
    }

    interrupt(): void {
        if (this.pty && this.status === Status.InProgress) {
            this.pty.kill("SIGINT");
            this.setStatus(Status.Interrupted);
            this.emit("end");
        }
    }

    sendSignal(signal: string): void {
        if (this.pty) {
            this.pty.kill(signal);
        }
    }

    winch(): void {
        if (this.pty && this.status === Status.InProgress) {
            this.pty.dimensions = this.dimensions;
        }
    }

    canBePrettified(): boolean {
        return this.status !== Status.InProgress && !!this.firstApplicablePrettyfier;
    }

    prettify(): React.ReactElement<any> {
        if (this.firstApplicablePrettyfier) {
            return this.firstApplicablePrettyfier.prettify(this);
        } else {
            throw "No applicable prettyfier found.";
        }
    }

    get environment(): Environment {
        // TODO: implement inline environment variable setting.
        return this.session.environment;
    }

    private get firstApplicablePrettyfier(): i.Prettyfier | undefined {
        return PluginManager.prettyfiers.find(prettyfier => prettyfier.isApplicable(this));
    }

    get screenBuffer(): ScreenBuffer {
        return this._screenBuffer;
    }

    get prompt(): Prompt {
        return this._prompt;
    }

    setStatus(status: Status): void {
        this.status = status;
        this.emit("status", status);
    }

    private throttledDataEmitter = () =>
        this._screenBuffer.size < ScreenBuffer.hugeOutputThreshold ? this.frequentDataEmitter() : this.rareDataEmitter()
}
