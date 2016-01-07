import Job from "./Job";
import Command from "./Command";
import Utils from './Utils';
import * as _ from 'lodash';
import PTY from "./PTY";
import * as Path from 'path';

abstract class CommandExecutionStrategy {
    protected args: string[];

    constructor(protected job: Job, protected command: string) {
        this.args = job.getPrompt().arguments.filter(argument => argument.length > 0);
    }

    static async canExecute(command: string): Promise<boolean> {
        return false;
    }

    abstract startExecution(): Promise<{}>;
}

class BuiltInCommandExecutionStrategy extends CommandExecutionStrategy {
    static async canExecute(command: string) {
        return Command.isBuiltIn(command);
    }

    startExecution() {
        return new Promise((resolve, reject) => {
            try {
                Command.executor(this.command)(this.job, this.args);
                resolve();
            } catch (error) {
                reject(error.message);
            }
        })
    }
}

class UnixSystemFileExecutionStrategy extends CommandExecutionStrategy {
    static async canExecute(command: string) {
        return _.include(await Utils.executablesInPaths(), command);
    }

    startExecution() {
        return new Promise((resolve, reject) => {
            this.job.command = new PTY(
                this.command, this.args, this.job.directory, this.job.dimensions,
                (data: string) => this.job.parser.parse(data),
                (exitCode: number) => exitCode === 0 ? resolve() : reject()
            );
        })
    }
}

class WindowsSystemFileExecutionStrategy extends CommandExecutionStrategy {
    static async canExecute(command: string) {
        return Utils.isWindows;
    }

    startExecution() {
        return new Promise((resolve) => {
            this.job.command = new PTY(
                this.cmdPath, ['/s', '/c', this.job.getPrompt().expanded.join(' ')], this.job.directory, this.job.dimensions,
                (data: string) => this.job.parser.parse(data),
                (exitCode: number) => resolve()
            );
        })
    }

    private get cmdPath(): string {
        if (process.env.comspec) {
            return process.env.comspec;
        }
        else if (process.env.SystemRoot) {
            return Path.join(process.env.SystemRoot, 'System32', 'cmd.exe');
        }
        else return 'cmd.exe';
    }
}

export default class CommandExecutor {
    private static executors = [
        BuiltInCommandExecutionStrategy,
        WindowsSystemFileExecutionStrategy,
        UnixSystemFileExecutionStrategy
    ];

    static async execute(job: Job): Promise<{}> {
        const command = job.getPrompt().commandName;
        const applicableExecutors = await Utils.filterAsync(this.executors, executor => executor.canExecute(command));

        if (applicableExecutors.length) {
            return new applicableExecutors[0](job, command).startExecution()
        } else {
            throw `Black Screen: command "${command}" not found.`
        }
    }
}

