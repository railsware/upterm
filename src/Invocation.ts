/// <reference path="references.ts" />

import pty = require('pty.js');
import child_process = require('child_process');
import _ = require('lodash');
import React = require('react');
import events = require('events');
import Parser = require('./Parser');
import Prompt = require('./Prompt');
import Buffer = require('./Buffer');
import Command = require('./Command');
import History = require('./History');
import i = require('./Interfaces');
import e = require('./Enums');
//TODO: Make them attributes;
import DecoratorsList = require('./decorators/List');
import DecoratorsBase = require('./decorators/Base');
import Utils = require("./Utils");
import CommandExecutor from "./CommandExecutor";

class Invocation extends events.EventEmitter {
    public command: pty.Terminal;
    public parser: Parser;
    private prompt: Prompt;
    private buffer: Buffer;
    public id: string;
    public status: e.Status = e.Status.NotStarted;

    constructor(public directory: string,
                public dimensions: i.Dimensions,
                private history: History = new History()) {
        super();

        this.prompt = new Prompt(directory);
        this.prompt.on('send', () => this.execute());

        this.buffer = new Buffer(dimensions);
        this.buffer.on('data', _.throttle(() => this.emit('data'), 1000 / 60));
        this.parser = new Parser(this);
        this.id = `invocation-${new Date().getTime()}`
    }

    execute(): void {
        this.setStatus(e.Status.InProgress);

        CommandExecutor.execute(this).then(
            () => {
                this.setStatus(e.Status.Success);
                this.emit('end')
            },
            (errorMessage) => {
                this.setStatus(e.Status.Failure);
                if (errorMessage) {
                    this.buffer.writeString(errorMessage, {color: e.Color.Red});
                }
                this.emit('end');
            }
        );
    }

    setPromptText(value: string): void {
        this.prompt.getBuffer().setTo(value);
    }

    // Writes to the process' stdin.
    write(input: string|React.KeyboardEvent) {
        if (typeof input == 'string') {
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
                if (code == e.CharCode.Backspace) {
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

        this.command.stdin.write(text);
    }

    hasOutput(): boolean {
        return !this.buffer.isEmpty();
    }

    getDimensions(): i.Dimensions {
        return this.dimensions;
    }

    setDimensions(dimensions: i.Dimensions) {
        this.dimensions = dimensions;

        if (this.command && this.status == e.Status.InProgress) {
            this.buffer.setDimensions(dimensions);
            this.command.resize(dimensions.columns, dimensions.rows);
        }
    }

    canBeDecorated(): boolean {
        for (var Decorator of DecoratorsList) {
            if ((new Decorator(this)).isApplicable()) {
                return true;
            }
        }
        return false;
    }

    decorate(): any {
        for (var Decorator of DecoratorsList) {
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

export = Invocation;
