import Invocation from "./Invocation";
import Command from "./Command";
import Utils from './Utils';
import * as pty from 'ptyw.js';
import * as _ from 'lodash';

export default class CommandExecutor {
    static execute(invocation: Invocation): Promise<CommandExecutionStrategy> {
        var command = invocation.getPrompt().getCommandName();
        var args = invocation.getPrompt().getArguments().filter(argument => argument.length > 0);

        return new Promise((resolve) => {
            if (Command.isBuiltIn(command)) {
                resolve(BuiltInCommandExecutionStrategy);
            } else {
                Utils.getExecutablesInPaths().then(executables => {
                    if (_.include(executables, command)) {
                        resolve(SystemFileExecutionStrategy);
                    } else {
                        resolve(NullExecutionStrategy);
                    }
                });
            }
        }).then((strategyConstructor: CommandExecutionStrategyConstructor) => new strategyConstructor(invocation, command, args).startExecution());
    }
}

type CommandExecutionStrategyConstructor = { new (invocation: Invocation, command: string, args: string[]): CommandExecutionStrategy }

abstract class CommandExecutionStrategy {
    constructor(protected invocation: Invocation, protected command: string, protected args: string[]) {
    }

    abstract startExecution(): Promise<{}>;
}

class BuiltInCommandExecutionStrategy extends CommandExecutionStrategy {
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
    startExecution() {
        return new Promise((resolve, reject) => {
            if (process.platform === 'win32') {
                this.args.unshift(this.command);
                this.args = ['/s', '/c', this.args.join(' ')];
                this.command = Utils.getCmdPath();
            }

            // TODO: move command to this class.
            this.invocation.command = pty.spawn(this.command, this.args, {
                cols: this.invocation.dimensions.columns,
                rows: this.invocation.dimensions.rows,
                cwd: this.invocation.directory,
                env: process.env
            });

            this.invocation.command.stdout.on('data', (data: string) => this.invocation.parser.parse(data.toString()));
            this.invocation.command.on('exit', (code: number) => {
                /* In windows there is no code returned (null) so instead of comparing to 0 we check if its 0 or null with ! */
                if (!code) {
                    resolve();
                } else {
                    reject();
                }
            })
        })
    }
}

class NullExecutionStrategy extends CommandExecutionStrategy {
    startExecution() {
        return new Promise((resolve, reject) => reject(`Black Screen: command "${this.command}" not found.`));
    }
}
