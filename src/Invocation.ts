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
import {Terminal} from "pty.js";

class Invocation extends events.EventEmitter {
    private command: pty.Terminal;
    private parser: Parser;
    private prompt: Prompt;
    private buffer: Buffer;
    public id: string;
    public status: e.Status = e.Status.NotStarted;

    constructor(private directory: string,
                private dimensions: i.Dimensions,
                private history: History = new History()) {
        super();

        this.prompt = new Prompt(directory);
        this.prompt.on('send', () => this.execute());

        this.buffer = new Buffer();
        this.buffer.on('data', _.throttle(() => this.emit('data'), 1000/60));
        this.parser = new Parser(this);
        this.id = `invocation-${new Date().getTime()}`
    }

    execute(): void {
        var command = this.prompt.getCommandName();
        var args = this.prompt.getArguments().filter(argument => argument.length > 0);

        if (Command.isBuiltIn(command)) {
            try {
                var newDirectory = Command.cd(this.directory, args);
                this.emit('working-directory-changed', newDirectory);
            } catch (error) {
                this.setStatus(e.Status.Failure);
                this.buffer.writeString(error.message, {color: e.Color.Red});
            }

            this.emit('end');
        } else {
            this.command = pty.spawn(command, args, {
                cols: this.dimensions.columns,
                rows: this.dimensions.rows,
                cwd: this.directory,
                env: process.env
            });

            this.setStatus(e.Status.InProgress);

            this.command.stdout.on('data', (data: string) => this.parser.parse(data.toString()));
            this.command.on('exit', (code: number) => {
                if (code === 0) {
                    this.setStatus(e.Status.Success);
                } else {
                    this.setStatus(e.Status.Failure);
                }

                this.emit('end');
            })
        }
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
                var code =parseInt(identifier.substring(2), 16);
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

    resize(dimensions: i.Dimensions) {
        this.dimensions = dimensions;

        if (this.command && this.status == e.Status.InProgress) {
            (<any>this.command).resize(dimensions.columns, dimensions.rows);
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
