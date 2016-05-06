import Job from "./Job";
import Command from "./Command";
import PTY from "./PTY";
import * as Path from "path";
import {executablesInPaths, resolveFile, isWindows, filterAsync, exists} from "./Utils";

abstract class CommandExecutionStrategy {
    protected args: string[];

    static async canExecute(job: Job): Promise<boolean> {
        return false;
    }

    constructor(protected job: Job) {
        this.args = job.prompt.arguments.filter(argument => argument.length > 0);
    }

    abstract startExecution(): Promise<{}>;
}

class BuiltInCommandExecutionStrategy extends CommandExecutionStrategy {
    static async canExecute(job: Job) {
        return Command.isBuiltIn(job.prompt.commandName);
    }

    startExecution() {
        return new Promise((resolve, reject) => {
            try {
                Command.executor(this.job.prompt.commandName)(this.job, this.args);
                resolve();
            } catch (error) {
                reject(error.message);
            }
        });
    }
}

class UnixSystemFileExecutionStrategy extends CommandExecutionStrategy {
    static async canExecute(job: Job) {
        return await this.isExecutableFromPath(job) || await this.isPathOfExecutable(job);
    }

    private static async isExecutableFromPath(job: Job): Promise<boolean> {
        return (await executablesInPaths(job.environment.path) ).includes(job.prompt.commandName);
    }

    private static async isPathOfExecutable(job: Job): Promise<boolean> {
        return await exists(resolveFile(job.session.directory, job.prompt.commandName));
    }

    startExecution() {
        return new Promise((resolve, reject) => {
            this.job.command = new PTY(
                this.job.prompt.commandName, this.args, this.job.environment.toObject(), this.job.dimensions,
                (data: string) => this.job.parser.parse(data),
                (exitCode: number) => exitCode === 0 ? resolve() : reject()
            );
        });
    }
}

class WindowsSystemFileExecutionStrategy extends CommandExecutionStrategy {
    static async canExecute(job: Job) {
        return isWindows();
    }

    startExecution() {
        return new Promise((resolve) => {
            this.job.command = new PTY(
                this.cmdPath, ["/s", "/c", this.job.prompt.expanded.join(" ")], this.job.environment.toObject(), this.job.dimensions,
                (data: string) => this.job.parser.parse(data),
                (exitCode: number) => resolve()
            );
        });
    }

    private get cmdPath(): string {
        if (this.job.environment.has("comspec")) {
            return this.job.environment.get("comspec");
        } else if (this.job.environment.has("SystemRoot")) {
            return Path.join(this.job.environment.get("SystemRoot"), "System32", "cmd.exe");
        } else {
            return "cmd.exe";
        }
    }
}

export default class CommandExecutor {
    private static executors = [
        BuiltInCommandExecutionStrategy,
        WindowsSystemFileExecutionStrategy,
        UnixSystemFileExecutionStrategy,
    ];

    static async execute(job: Job): Promise<{}> {
        const applicableExecutors = await filterAsync(this.executors, executor => executor.canExecute(job));

        if (applicableExecutors.length) {
            return new applicableExecutors[0](job).startExecution();
        } else {
            throw `Black Screen: command "${job.prompt.commandName}" not found.\n`;
        }
    }
}

