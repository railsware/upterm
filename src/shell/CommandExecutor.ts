import {Job} from "./Job";
import {Command} from "./Command";
import {PTY} from "../PTY";
import * as Path from "path";
import {resolveFile, isWindows, filterAsync, io} from "../utils/Common";
import {loginShell} from "../utils/Shell";

export class NonZeroExitCodeError extends Error {
}

abstract class CommandExecutionStrategy {
    static async canExecute(_job: Job): Promise<boolean> {
        return false;
    }

    constructor(protected job: Job) {
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
                Command.executor(this.job.prompt.commandName)(this.job, this.job.prompt.arguments.map(token => token.value));
                resolve();
            } catch (error) {
                reject(error.message);
            }
        });
    }
}

class ShellExecutionStrategy extends CommandExecutionStrategy {
    static async canExecute(job: Job) {
        return loginShell.preCommandModifiers.includes(job.prompt.commandName) ||
            await this.isExecutableFromPath(job) ||
            await this.isPathOfExecutable(job) ||
            this.isBashFunc(job);
    }

    private static isBashFunc(job: Job): boolean {
        return job.environment.has(`BASH_FUNC_${job.prompt.commandName}%%`);
    }

    private static async isExecutableFromPath(job: Job): Promise<boolean> {
        return (await io.executablesInPaths(job.environment.path)).includes(job.prompt.commandName);
    }

    private static async isPathOfExecutable(job: Job): Promise<boolean> {
        return await io.fileExists(resolveFile(job.session.directory, job.prompt.commandName));
    }

    startExecution() {
        return new Promise((resolve, reject) => {
            this.job.setPty(new PTY(
                this.job.prompt.expandedTokens.map(token => token.escapedValue),
                this.job.environment.toObject(),
                this.job.dimensions,
                (data: ANSIString) => this.job.output.write(data),
                (exitCode: number) => exitCode === 0 ? resolve() : reject(new NonZeroExitCodeError(exitCode.toString())),
            ));
        });
    }
}

class WindowsShellExecutionStrategy extends CommandExecutionStrategy {
    static async canExecute(_job: Job) {
        return isWindows;
    }

    startExecution() {
        return new Promise((resolve) => {
            this.job.setPty(new PTY(
                [
                    this.cmdPath,
                    "/s" as EscapedShellWord,
                    "/c" as EscapedShellWord,
                    ...this.job.prompt.expandedTokens.map(token => token.escapedValue),
                ],
                this.job.environment.toObject(), this.job.dimensions,
                (data: ANSIString) => this.job.output.write(data),
                (_exitCode: number) => resolve(),
            ));
        });
    }

    private get cmdPath(): EscapedShellWord {
        if (this.job.environment.has("comspec")) {
            return this.job.environment.get("comspec") as EscapedShellWord;
        } else if (this.job.environment.has("SystemRoot")) {
            return Path.join(this.job.environment.get("SystemRoot"), "System32", "cmd.exe") as EscapedShellWord;
        } else {
            return "cmd.exe" as EscapedShellWord;
        }
    }
}

export class CommandExecutor {
    private static executors = [
        BuiltInCommandExecutionStrategy,
        WindowsShellExecutionStrategy,
        ShellExecutionStrategy,
    ];

    static async execute(job: Job): Promise<{}> {
        const applicableExecutors = await filterAsync(this.executors, executor => executor.canExecute(job));

        if (applicableExecutors.length) {
            return new applicableExecutors[0](job).startExecution();
        } else {
            throw `Upterm: command "${job.prompt.commandName}" not found.\n`;
        }
    }
}
