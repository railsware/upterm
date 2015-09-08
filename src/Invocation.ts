/// <reference path="references.ts" />

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

import BufferedProcess = require('./BufferedProcess');

class Invocation extends events.EventEmitter {
    private command: child_process.ChildProcess;
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

    /* TODO: Fix child_pty issues */
    execute(): void {
        var command = this.prompt.getCommandName();
        var args = this.prompt.getArguments().filter(argument => argument.length > 0);

        if (Command.isBuiltIn(command)) {
            switch (command) {
                case 'cd':
                    try {
                        var newDirectory = Command.cd(this.directory, args);
                        this.emit('working-directory-changed', newDirectory);
                    } catch (error) {
                        this.setStatus(e.Status.Failure);
                        this.buffer.writeString(error.message, { color: e.Color.Red });
                    }

                    this.emit('end');
                    break;
                case 'clear':
                    this.emit('clear');
                    break;
            }
        } else if (process.platform === 'darwin') {
            this.command = require('child_pty').spawn(command, args, {
                columns: this.dimensions.columns,
                rows: this.dimensions.rows,
                cwd: this.directory,
                env: process.env
            });

            this.setStatus(e.Status.InProgress);

            this.command.stdout.on('data', (data: string) => this.parser.parse(data.toString()));
            this.command.on('close', (code: number, signal: string) => {
                if (code === 0) {
                    this.setStatus(e.Status.Success);
                } else {
                    this.setStatus(e.Status.Failure);
                }
                this.emit('end');
            });
        } else {
            var _bufferedProcess = new BufferedProcess(command, args, {
                columns: this.dimensions.columns,
                rows: this.dimensions.rows,
                cwd: this.directory,
                env: process.env
            }, (std) => {
                console.log('Output: ', std);

                this.parser.parse(std.toString());
            }, (err) => {
                console.log('Error: ', err);

                this.parser.parse(err.toString())
                this.setStatus(e.Status.Failure);
            }, () => {
                this.emit('end');
            });

            _bufferedProcess.onError((error: Object) => {
                this.setStatus(e.Status.Failure);

                this.emit('end');
            });
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
            (<any>this.command.stdout).resize(dimensions);
        }
    }

    canBeDecorated(): boolean {
        DecoratorsList.forEach((decorator) => {
            var _decorator = new decorator(this);

            if (typeof _decorator.isApplicable !== 'undefined') {
                return _decorator.isApplicable();
            } else return false;
        });

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
