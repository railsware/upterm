import * as _ from "lodash";
import * as i from "./Interfaces";
import * as e from "./Enums";
import * as React from "react";
import Terminal from "./Terminal";
import Parser from "./Parser";
import Prompt from "./Prompt";
import Buffer from "./Buffer";
import CommandExecutor from "./CommandExecutor";
import PTY from "./PTY";
import PluginManager from "./PluginManager";
import EmitterWithUniqueID from "./EmitterWithUniqueID";

function makeThrottledDataEmitter(timesPerSecond: number, subject: EmitterWithUniqueID) {
    return _.throttle(() => subject.emit("data"), 1000 / timesPerSecond);
}

export default class Job extends EmitterWithUniqueID {
    public command: PTY;
    public parser: Parser;
    public status: e.Status = e.Status.NotStarted;
    private _prompt: Prompt;
    private buffer: Buffer;
    private rareDataEmitter: Function;
    private frequentDataEmitter: Function;

    constructor(private _terminal: Terminal) {
        super();

        this._prompt = new Prompt(this);
        this._prompt.on("send", () => this.execute());

        this.rareDataEmitter = makeThrottledDataEmitter(1, this);
        this.frequentDataEmitter = makeThrottledDataEmitter(60, this);

        this.buffer = new Buffer(this.dimensions);
        this.buffer.on("data", this.throttledDataEmitter.bind(this));
        this.parser = new Parser(this);
    }

    execute(): void {
        this.setStatus(e.Status.InProgress);

        Promise.all(
            PluginManager.preexecPlugins.map(plugin => plugin(this))
        ).then(
            () => CommandExecutor.execute(this),
            errorMessage => this.handleError(errorMessage)
        ).then(
            () => {
                // Need to check the status here because it"s
                // executed even after the process was killed.
                if (this.status === e.Status.InProgress) {
                    this.setStatus(e.Status.Success);
                }
                this.emit("end");
            },
            errorMessage => this.handleError(errorMessage)
        );
    }

    handleError(message: string): void {
        this.setStatus(e.Status.Failure);
        if (message) {
            this.buffer.writeString(message);
        }
        this.emit("end");
    }

    // Writes to the process" stdin.
    write(input: string|KeyboardEvent) {
        let text: string;

        if (typeof input === "string") {
            text = <string>input;
        } else {
            const event = <KeyboardEvent>input;
            const identifier: string = (<any>input).nativeEvent.keyIdentifier;

            if (identifier.startsWith("U+")) {
                let code = parseInt(identifier.substring(2), 16);

                /**
                 * In VT-100 emulation mode backspace should be translated to delete.
                 * http://www.braun-home.net/michael/mbedit/info/misc/VT100_commands.htm
                 */
                if (code === e.CharCode.Backspace) {
                    code = e.CharCode.Delete;
                }

                text = String.fromCharCode(code);

                if (event.ctrlKey) {
                    text = String.fromCharCode(code - 64);
                } else if (!event.shiftKey && code >= 65 && code <= 90) {
                    text = text.toLowerCase();
                }
            } else {
                text = String.fromCharCode(event.keyCode);
            }
        }

        this.command.write(text);
    }

    get terminal(): Terminal {
        return this._terminal;
    }

    get directory(): string {
        return this.terminal.currentDirectory;
    }

    get dimensions(): Dimensions {
        return this.terminal.dimensions;
    }

    hasOutput(): boolean {
        return !this.buffer.isEmpty();
    }

    getDimensions(): Dimensions {
        return this.terminal.dimensions;
    }

    setDimensions(dimensions: Dimensions) {
        this.terminal.dimensions = dimensions;
        this.winch();
    }

    interrupt(): void {
        if (this.command && this.status === e.Status.InProgress) {
            this.command.kill("SIGINT");
            this.setStatus(e.Status.Interrupted);
        }
    }

    winch(): void {
        if (this.command && this.status === e.Status.InProgress) {
            this.buffer.dimensions = this.dimensions;
            this.command.dimensions = this.dimensions;
        }
    }

    canBeDecorated(): boolean {
        return !!this.firstApplicableDecorator;
    }

    decorate(): React.ReactElement<any> {
        return this.firstApplicableDecorator.decorate(this);
    }

    private get decorators(): i.OutputDecorator[] {
        return PluginManager.outputDecorators.filter(decorator =>
            this.status === e.Status.InProgress ? decorator.shouldDecorateRunningPrograms : true
        );
    }

    private get firstApplicableDecorator(): i.OutputDecorator {
        return _.find(this.decorators, decorator => decorator.isApplicable(this));
    }

    getBuffer(): Buffer {
        return this.buffer;
    }

    get prompt(): Prompt {
        return this._prompt;
    }

    setStatus(status: e.Status): void {
        this.status = status;
        this.emit("status", status);
    }

    private throttledDataEmitter() {
        this.buffer.size < Buffer.hugeOutputThreshold ? this.frequentDataEmitter() : this.rareDataEmitter();
    }
}
