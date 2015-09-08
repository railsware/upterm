/// <reference path="references.ts" />

var stripAnsi = require('strip-ansi');

import pty = require('pty.js');
import path = require('path');
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
        } else {
            if (process.platform == 'win32') {
                args.unshift(command);
                args = ['/s', '/c', args.join(' ')];
                command = this.getCmdPath();
            }

            this.command = pty.spawn(command, args, {
                cols: this.dimensions.columns,
                rows: this.dimensions.rows,
                cwd: this.directory,
                env: process.env
            });

            this.setStatus(e.Status.InProgress);
          
            this.command.stdout.on('data', (data: string) => this.parser.parse(stripAnsi( data.toString() )));
            this.command.on('exit', (code: number) => {
                if (!code || code === 0) {
                    this.setStatus(e.Status.Success);
                } else {
                    this.setStatus(e.Status.Failure);
                }

                this.emit('end');
            });
        }
    }

    setPromptText(value: string): void {
        this.prompt.getBuffer().setTo(value);
    }

    getCmdPath(): string {
        if (process.env.comspec) {
            return process.env.comspec;
        }
        else if (process.env.SystemRoot) {
            return path.join(process.env.SystemRoot, 'System32', 'cmd.exe');
        }
        else return 'cmd.exe';
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
            this.command.resize(dimensions.columns, dimensions.rows);
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
