import Invocation from "./Invocation";
import Command from "./Command";
import Utils from './Utils';
import * as Path from 'path';
import * as pty from 'ptyw.js';
import * as _ from 'lodash';

abstract class CommandExecutionStrategy {
    protected args: string[];

    constructor(protected invocation: Invocation, protected command: string) {
        this.args = invocation.getPrompt().getArguments().filter(argument => argument.length > 0);
    }

    static canExecute(command: string): Promise<boolean> {
        return new Promise(resolve => resolve(false));
    }

    abstract startExecution(): Promise<{}>;
}

class BuiltInCommandExecutionStrategy extends CommandExecutionStrategy {
    static canExecute(command: string): Promise<boolean> {
        return new Promise(resolve => resolve(Command.isBuiltIn(command)));
    }

    startExecution() {
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
    static canExecute(command: string): Promise<boolean> {
        return new Promise(resolve => Utils.getExecutablesInPaths().then(executables => resolve(_.include(executables, command))));
    }

    startExecution() {
        return new Promise((resolve, reject) => {
            // TODO: move command to this class.
            this.invocation.command = pty.spawn(process.env.SHELL, ['-c', `${this.command} ${this.args.join(' ')}`], {
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

class WindowsSystemFileExecutionStrategy extends CommandExecutionStrategy {
    static canExecute(command: string): Promise<boolean> {
        return new Promise(resolve => Utils.getExecutablesInPaths().then(executables => resolve(_.include(executables, command))));
    }

    startExecution() {
        return new Promise((resolve, reject) => {
            this.args.unshift(this.command);
            this.args = ['/s', '/c', this.args.join(' ')];
            this.command = this.cmdPath;

            this.invocation.command = pty.spawn(this.command, this.args, {
                cols: this.invocation.dimensions.columns,
                rows: this.invocation.dimensions.rows,
                cwd: this.invocation.directory,
                env: process.env
            });

            this.invocation.command.stdout.on('data', (data: string) => this.invocation.parser.parse(data.toString()));
            this.invocation.command.on('exit', (code: number) => {
                /* In windows there is no code returned (null) so instead of comparing to 0 we check if its 0 or null with ! */
                if (Number(code) === 0) {
                    resolve();
                } else {
                    reject();
                }
            })
        })
    }

    private get cmdPath(): string {
        if (process.env.comspec) {
            return process.env.comspec;
        }
        else if (process.env.SystemRoot) {
            return require('path').join(process.env.SystemRoot, 'System32', 'cmd.exe');
        }
        else return 'cmd.exe';
    }
}

class NullExecutionStrategy extends CommandExecutionStrategy {
    static canExecute(command: string): Promise<boolean> {
        return new Promise(resolve => resolve(true));
    }

    startExecution() {
        return new Promise((resolve, reject) => reject(`Black Screen: command "${this.command}" not found.`));
    }
}

export default class CommandExecutor {
    private static executors = [
        BuiltInCommandExecutionStrategy,
        process.platform === 'win32' ? WindowsSystemFileExecutionStrategy : SystemFileExecutionStrategy
    ];

    static execute(invocation: Invocation): Promise<CommandExecutionStrategy> {
        var command = invocation.getPrompt().getCommandName();

        return Utils.filterWithPromising(
            this.executors.concat(NullExecutionStrategy), 
            executor => executor.canExecute(command))
                .then(applicableExecutors => new applicableExecutors[0](invocation, command).startExecution()
        );
    }
}

