/// <reference path="references.ts" />

import * as pty from 'ptyw.js';
import * as child_process from 'child_process';
import * as _ from 'lodash';
import * as React from 'react';
import * as events from 'events';
import Terminal from "./Terminal";
import Parser from './Parser';
import Prompt from './Prompt';
import Buffer from './Buffer';
import Command from './Command';
import History from './History';
import * as i from './Interfaces';
import * as e from './Enums';
//TODO: Make them attributes;
import {list} from './decorators/List';
import DecoratorsBase from './decorators/Base';
import Utils from './Utils';
import CommandExecutor from "./CommandExecutor";
import PTY from "./PTY";

export default class Invocation extends events.EventEmitter {
    public command: PTY;
    public parser: Parser;
    private prompt: Prompt;
    private buffer: Buffer;
    public id: string;
    public status: e.Status = e.Status.NotStarted;

    constructor(private _terminal: Terminal) {
        super();

        this.prompt = new Prompt(this.directory);
        this.prompt.on('send', () => this.execute());

        this.buffer = new Buffer(this.dimensions);
        this.buffer.on('data', _.throttle(() => this.emit('data'), 1000 / 60));
        this.parser = new Parser(this);
        this.id = `invocation-${new Date().getTime()}`
    }

    execute(): void {
        this.setStatus(e.Status.InProgress);

        CommandExecutor.execute(this).then(
            () => {
                // Need to check the status here because it's
                // executed even after the process was killed.
                if (this.status === e.Status.InProgress) {
                    this.setStatus(e.Status.Success);
                }
                this.onEnd();
            },
            (errorMessage) => {
                this.setStatus(e.Status.Failure);
                if (errorMessage) {
                    this.buffer.writeString(errorMessage, {color: e.Color.Red});
                }
                this.onEnd();
            }
        );
    }

    setPromptText(value: string): void {
        this.prompt.getBuffer().setTo(value);
    }

    onEnd(): void {
        this.emit('end');
        this.prompt.onEnd();
    }

    // Writes to the process' stdin.
    write(input: string|React.KeyboardEvent) {
        if (typeof input === 'string') {
            var text = <string>input
        } else {
            var event = <React.KeyboardEvent>input;
            var identifier: string = (<any>event.nativeEvent).keyIdentifier;

            if (identifier.startsWith('U+')) {
                var code = parseInt(identifier.substring(2), 16);

                /**
                 * In VT-100 emulation mode backspace should be translated to delete.
                 * http://www.braun-home.net/michael/mbedit/info/misc/VT100_commands.htm
                 */
                if (code === e.CharCode.Backspace) {
                    code = e.CharCode.Delete;
                }

                text = String.fromCharCode(code);
                if (!event.shiftKey && code >= 65 && code <= 90) {
                    text = text.toLowerCase()
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

    get dimensions(): i.Dimensions {
        return this.terminal.dimensions;
    }

    hasOutput(): boolean {
        return !this.buffer.isEmpty();
    }

    getDimensions(): i.Dimensions {
        return this.terminal.dimensions;
    }

    setDimensions(dimensions: i.Dimensions) {
        this.terminal.dimensions = dimensions;
        this.winch();
    }

    interrupt(): void {
        if (this.command && this.status === e.Status.InProgress) {
            this.command.kill('SIGINT');
            this.setStatus(e.Status.Interrupted);
        }
    }

    winch(): void {
        if (this.command && this.status === e.Status.InProgress) {
            this.buffer.setDimensions(this.dimensions);
            this.command.dimensions = this.dimensions;
        }
    }

    canBeDecorated(): boolean {
        for (var Decorator of list) {
            var decorator = new Decorator(this);

            if (this.status === e.Status.InProgress && !decorator.shouldDecorateRunningPrograms()) {
                continue;
            }

            if (decorator.isApplicable()) {
                return true;
            }
        }
        return false;
    }

    decorate(): any {
        for (var Decorator of list) {
            var decorator: DecoratorsBase = new Decorator(this);
            if (decorator.isApplicable()) {
                return decorator.decorate();
            }
        }
    }

    getBuffer(): Buffer {
        return this.buffer;
    }

    getPrompt(): Prompt {
        return this.prompt;
    }

    setStatus(status: e.Status): void {
        this.status = status;
        this.emit('status', status);
    }
}
