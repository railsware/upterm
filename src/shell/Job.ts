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
import {normalizeProcessInput} from "../utils/Common";
import {TerminalLikeDevice} from "../Interfaces";

export class Job extends EmitterWithUniqueID implements TerminalLikeDevice {
    public status: Status = Status.InProgress;
    readonly startTime = Date.now();
    private readonly _output: Output;
    private readonly throttledDataEmitter = _.throttle(() => this.emit("data"), 1000 / 60);
    private pty: PTY | undefined;

    constructor(private _session: Session, private _prompt: Prompt) {
        super();
        this._output = new Output(this, this._session.dimensions);
        this._output.on("data", this.throttledDataEmitter);
    }

    async execute(): Promise<void> {
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

    isRunningPty(): boolean {
        return this.pty !== undefined;
    }

    setPty(pty: PTY) {
        this.pty = pty;
    }

    // Writes to the process' STDIN.
    write(input: string | KeyboardEvent) {
        this.pty!.write(normalizeProcessInput(input, this.output.isCursorKeysModeSet));
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
