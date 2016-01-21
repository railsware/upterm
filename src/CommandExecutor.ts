import Job from "./Job";
import Command from "./Command";
import Utils from "./Utils";
import PTY from "./PTY";
import * as Path from "path";

abstract class CommandExecutionStrategy {
    protected args: string[];

    constructor(protected job: Job) {
        this.args = job.prompt.arguments.filter(argument => argument.length > 0);
    }

    static async canExecute(job: Job): Promise<boolean> {
        return false;
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
        return (await Utils.executablesInPaths()).includes(job.prompt.commandName) ||
            await Utils.exists(Utils.resolveFile(job.directory, job.prompt.commandName));
    }

    startExecution() {
        return new Promise((resolve, reject) => {
            this.job.command = new PTY(
                this.job.prompt.commandName, this.args, this.job.directory, this.job.dimensions,
                (data: string) => this.job.parser.parse(data),
                (exitCode: number) => exitCode === 0 ? resolve() : reject()
            );
        });
    }
}

class WindowsSystemFileExecutionStrategy extends CommandExecutionStrategy {
    static async canExecute(job: Job) {
        return Utils.isWindows;
    }

    startExecution() {
        return new Promise((resolve) => {
            this.job.command = new PTY(
                this.cmdPath, ["/s", "/c", this.job.prompt.expanded.join(" ")], this.job.directory, this.job.dimensions,
                (data: string) => this.job.parser.parse(data),
                (exitCode: number) => resolve()
            );
        });
    }

    private get cmdPath(): string {
        if (process.env.comspec) {
            return process.env.comspec;
        } else if (process.env.SystemRoot) {
            return Path.join(process.env.SystemRoot, "System32", "cmd.exe");
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
        const applicableExecutors = await Utils.filterAsync(this.executors, executor => executor.canExecute(job));

        if (applicableExecutors.length) {
            return new applicableExecutors[0](job).startExecution();
        } else {
            throw `Black Screen: command "${job.prompt.commandName}" not found.`;
        }
    }
}

