import * as _ from "lodash";
import * as i from "./Interfaces";
import * as React from "react";
import Session from "./Session";
import ANSIParser from "./ANSIParser";
import Prompt from "./Prompt";
import Buffer from "./Buffer";
import CommandExecutor from "./CommandExecutor";
import PTY from "./PTY";
import PluginManager from "./PluginManager";
import EmitterWithUniqueID from "./EmitterWithUniqueID";
import {Status} from "./Enums";
import Environment from "./Environment";
import {convertKeyCode} from "./utils/Common";

function makeThrottledDataEmitter(timesPerSecond: number, subject: EmitterWithUniqueID) {
    return _.throttle(() => subject.emit("data"), 1000 / timesPerSecond);
}

export default class Job extends EmitterWithUniqueID {
    public command: PTY;
    public status: Status = Status.NotStarted;
    public readonly parser: ANSIParser;
    private readonly _prompt: Prompt;
    private readonly _buffer: Buffer;
    private readonly rareDataEmitter: Function;
    private readonly frequentDataEmitter: Function;

    constructor(private _session: Session) {
        super();

        this._prompt = new Prompt(this);
        this._prompt.on("send", () => this.execute());

        this.rareDataEmitter = makeThrottledDataEmitter(1, this);
        this.frequentDataEmitter = makeThrottledDataEmitter(60, this);

        this._buffer = new Buffer(this.dimensions);
        this._buffer.on("data", this.throttledDataEmitter);
        this.parser = new ANSIParser(this);
    }

    async execute(): Promise<void> {
        this.setStatus(Status.InProgress);

        await Promise.all(PluginManager.preexecPlugins.map(plugin => plugin(this)));

        try {
            await CommandExecutor.execute(this);

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

    handleError(message: string): void {
        this.setStatus(Status.Failure);
        if (message) {
            this._buffer.writeMany(message);
        }
        this.emit("end");
    }

    // Writes to the process' STDIN.
    write(input: string|KeyboardEvent) {
        let text: string;

        if (typeof input === "string") {
            text = input;
        } else {
            const event = <KeyboardEvent>(<any>input).nativeEvent;
            let code = event.keyCode;

            if (event.ctrlKey) {
                text = String.fromCharCode(code - 64);
            } else {
                text = convertKeyCode(code, event.shiftKey);
            }
        }

        this.command.write(text);
    }

    get session(): Session {
        return this._session;
    }

    get dimensions(): Dimensions {
        return this.session.dimensions;
    }

    hasOutput(): boolean {
        return !this._buffer.isEmpty();
    }

    getDimensions(): Dimensions {
        return this.session.dimensions;
    }

    setDimensions(dimensions: Dimensions) {
        this.session.dimensions = dimensions;
        this.winch();
    }

    interrupt(): void {
        if (this.command && this.status === Status.InProgress) {
            this.command.kill("SIGINT");
            this.setStatus(Status.Interrupted);
            this.emit("end");
        }
    }

    winch(): void {
        if (this.command && this.status === Status.InProgress) {
            this._buffer.dimensions = this.dimensions;
            this.command.dimensions = this.dimensions;
        }
    }

    canBeDecorated(): boolean {
        return !!this.firstApplicableDecorator;
    }

    decorate(): React.ReactElement<any> {
        return this.firstApplicableDecorator.decorate(this);
    }

    get environment(): Environment {
        // TODO: implement inline environment variable setting.
        return this.session.environment;
    }

    private get decorators(): i.OutputDecorator[] {
        return PluginManager.outputDecorators.filter(decorator =>
            this.status === Status.InProgress ? decorator.shouldDecorateRunningPrograms : true
        );
    }

    private get firstApplicableDecorator(): i.OutputDecorator {
        return this.decorators.find(decorator => decorator.isApplicable(this));
    }

    get buffer(): Buffer {
        return this._buffer;
    }

    get prompt(): Prompt {
        return this._prompt;
    }

    setStatus(status: Status): void {
        this.status = status;
        this.emit("status", status);
    }

    private throttledDataEmitter = () =>
        this._buffer.size < Buffer.hugeOutputThreshold ? this.frequentDataEmitter() : this.rareDataEmitter();
}
