import * as _ from "lodash";
import * as i from "../Interfaces";
import * as React from "react";
import {Session} from "./Session";
import {Prompt} from "./Prompt";
import {Output} from "../Output";
import {CommandExecutor, NonZeroExitCodeError} from "./CommandExecutor";
import {PTY} from "../PTY";
import {PluginManager} from "../PluginManager";
import {EmitterWithUniqueID} from "../EmitterWithUniqueID";
import {Status} from "../Enums";
import {Environment} from "./Environment";
import {normalizeKey} from "../utils/Common";
import {TerminalLikeDevice} from "../Interfaces";
import {History} from "./History";

export class Job extends EmitterWithUniqueID implements TerminalLikeDevice {
    public status: Status = Status.InProgress;
    private readonly _output: Output;
    private readonly throttledDataEmitter = _.throttle(() => this.emit("data"), 1000 / 60);
    private pty: PTY | undefined;

    constructor(private _session: Session, private _prompt: Prompt) {
        super();
        this._output = new Output(this, this._session.dimensions);
        this._output.on("data", this.throttledDataEmitter);
    }

    async execute(): Promise<void> {
        History.add(this.prompt.value);
        await Promise.all(PluginManager.preexecPlugins.map(plugin => plugin(this)));

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
        } catch (exception) {
            this.handleError(exception);
        } finally {
            this.emit("end");
        }
    }

    handleError(message: NonZeroExitCodeError | string): void {
        this.setStatus(Status.Failed);
        if (message) {
            if (message instanceof NonZeroExitCodeError) {
                // Do nothing.
            } else {
                this._output.write(message);
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
                text = normalizeKey(input.key, this.output.isCursorKeysModeSet);
            }
        }

        (this.pty as PTY).write(text);
    }

    get session(): Session {
        return this._session;
    }

    hasOutput(): boolean {
        return !this._output.isEmpty();
    }

    interrupt(): void {
        if (this.pty && this.status === Status.InProgress) {
            this.pty.kill("SIGINT");
            this.setStatus(Status.Failed);
            this.emit("end");
        }
    }

    resize(): void {
        if (this.pty && this.status === Status.InProgress) {
            this.pty.resize(this.session.dimensions);
            this.output.dimensions = this.session.dimensions;
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

    get output(): Output {
        return this._output;
    }

    get prompt(): Prompt {
        return this._prompt;
    }

    setStatus(status: Status): void {
        this.status = status;
        this.emit("status", status);
    }
}
