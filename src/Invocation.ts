/// <reference path="references.ts" />

var child_pty = require('child_pty');
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
    private command: child_process.ChildProcess;
    private parser: Parser;
    private prompt: Prompt;
    private buffer: Buffer;
    public id: string;
    public status: e.Status = e.Status.NotStarted;

    constructor(private directory: string,
                private dimensions: i.Dimensions,
                private history: History) {
        super();

        this.prompt = new Prompt(directory);
        this.prompt.on('send', () => {
            this.execute();
        });

        this.buffer = new Buffer();
        this.buffer.on('data', _.throttle(() => { this.emit('data'); }, 1000/60));
        this.parser = new Parser(this.buffer);
        this.id = `invocation-${new Date().getTime()}`
    }

    execute(): void {
        var command = this.prompt.getCommandName();

        if (Command.isBuiltIn(command)) {
            try {
                var newDirectory = Command.cd(this.directory, this.prompt.getArguments());
                this.emit('working-directory-changed', newDirectory);
            } catch (error) {
                this.setStatus(e.Status.Failure);
                this.buffer.writeString(error.message, {color: e.Color.Red});
            }

            this.emit('end');
        } else {
            this.command = child_pty.spawn(command, this.prompt.getArguments(), {
                columns: this.dimensions.columns,
                rows: this.dimensions.rows,
                cwd: this.directory,
                env: process.env
            });

            this.setStatus(e.Status.InProgress);

            this.command.stdout.on('data', (data: string) => {
                this.parser.parse(data.toString());
            });
            this.command.on('close', (code: number, signal: string) => {
                if (code === 0) {
                    this.setStatus(e.Status.Success);
                } else {
                    this.setStatus(e.Status.Failure);
                }
                this.emit('end');
            })
        }
    }

    write(event: React.KeyboardEvent) {
        var identifier: string = (<any>event.nativeEvent).keyIdentifier;

        if (identifier.startsWith('U+')) {
            var code =parseInt(identifier.substring(2), 16);
            var char = String.fromCharCode(code);
            if (!event.shiftKey && code >= 65 && code <= 90) {
                char = char.toLowerCase()
            }
        } else {
            char = String.fromCharCode(event.keyCode);
        }

        this.command.stdin.write(char);
    }

    hasOutput(): boolean {
        return !this.buffer.isEmpty();
    }

    resize(dimensions: i.Dimensions) {
        this.dimensions = dimensions;

        if (this.command) {
            this.command.kill('SIGWINCH');
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
