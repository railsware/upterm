/// <reference path="references.ts" />

var pty = require('pty.js');
import _ = require('lodash');
import events = require('events');
import Parser = require('Parser');
import Prompt = require('Prompt');
import Buffer = require('Buffer');
import Command = require('Command');
import i = require('Interfaces');
import e = require('Enums');
//TODO: Make them attributes;
import DecoratorsList = require('./decorators/List');
import DecoratorsBase = require('./decorators/Base');

class Invocation extends events.EventEmitter {
    private command: NodeJS.Process;
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
        this.buffer.on('data', _.throttle(() => {
            this.emit('data');
        }, 1000 / 3));

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
                this.status = e.Status.Failure;
                this.buffer.writeString(error.message, {color: e.Color.Red});
            }

            this.emit('end');
        } else {
            this.command = pty.spawn(command, this.prompt.getArguments(), {
                cols: this.dimensions.columns,
                rows: this.dimensions.rows,
                cwd: this.directory,
                env: process.env
            });

            this.command.on('data', (data: string) => {
                this.parser.parse(data);
            }).on('exit', (code: number, signal: string) => {
                if (code === 0) {
                    this.status = e.Status.Success;
                } else {
                    this.status = e.Status.Failure;
                }
                this.emit('end');
            })
        }
    }

    hasOutput(): boolean {
        return !this.buffer.isEmpty();
    }

    resize(dimensions: i.Dimensions) {
        this.dimensions = dimensions;

        if (this.command) {
            this.command.kill(this.command.pid, 'SIGWINCH');
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
}

export = Invocation;
