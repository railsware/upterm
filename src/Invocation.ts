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

class CommandExecutor {
    static execute(invocation: Invocation): Promise<CommandExecutionStrategy> {
        var command = invocation.getPrompt().getCommandName();
        var args = invocation.getPrompt().getArguments().filter(argument => argument.length > 0);

        return new Promise((resolve) => {
            if (Command.isBuiltIn(command)) {
                resolve(new BuiltInCommandExecutionStrategy(invocation, command, args));
            } else {
                Utils.getExecutablesInPaths().then(executables => {
                    if (_.include(executables, command)) {
                        resolve(new SystemFileExecutionStrategy(invocation, command, args));
                    } else {
                        resolve(new NullExecutionStrategy(invocation, command, args));
                    }
                });
            }
        }).then((strategy: CommandExecutionStrategy) => strategy.startExecution());
    }
}

abstract class CommandExecutionStrategy {
    constructor(protected invocation: Invocation, protected command: string, protected args: string[]) {
    }

    abstract startExecution(): Promise<any>;
}

class BuiltInCommandExecutionStrategy extends CommandExecutionStrategy {
    startExecution(): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                var newDirectory = Command.cd(this.invocation.directory, this.args);
                this.invocation.emit('working-directory-changed', newDirectory);
                resolve();
            } catch (error) {
                reject(error.message);
            }
        })
    }
}

class SystemFileExecutionStrategy extends CommandExecutionStrategy {
    startExecution(): Promise<any> {
        return new Promise((resolve, reject) => {
            // TODO: move command to this class.
            this.invocation.command = pty.spawn(this.command, this.args, {
                cols: this.invocation.dimensions.columns,
                rows: this.invocation.dimensions.rows,
                cwd: this.invocation.directory,
                env: process.env
            });

            this.invocation.command.stdout.on('data', (data: string) => this.invocation.parser.parse(data.toString()));
            this.invocation.command.on('exit', (code: number) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject();
                }
            })
        })
    }
}

class NullExecutionStrategy extends CommandExecutionStrategy {
    startExecution(): Promise<any> {
        return new Promise((resolve, reject) => reject(`Black Screen: command "${this.command}" not found.`));
    }
}

export = Invocation;
