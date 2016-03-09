import Job from "./Job";
import * as Path from "path";
import {existsSync, statSync} from "fs";
import {homeDirectory, pluralize, resolveDirectory} from "./Utils";

const executors: Dictionary<(i: Job, a: string[]) => void> = {
    cd: (job: Job, args: string[]): void => {
        let fullPath: string;

        if (!args.length) {
            fullPath = homeDirectory();
        } else {
            let enteredPath = args[0];

            if (isHistoricalDirectory(enteredPath)) {
                fullPath = expandHistoricalDirectory(enteredPath, job);
            } else {
                fullPath = job.environment.cdpath(job.session.directory)
                    .map(path => resolveDirectory(path, enteredPath))
                    .filter(resolved => existsSync(resolved))
                    .filter(resolved => statSync(resolved).isDirectory())[0];

                if (!fullPath) {
                    throw new Error(`The directory "${enteredPath}" doesn't exist.`);
                }
            }
        }

        job.session.directory = fullPath;
    },
    clear: (job: Job, args: string[]): void => {
        setTimeout(() => job.session.clearJobs(), 0);
    },
    exit: (job: Job, args: string[]): void => {
        job.session.remove();
    },
    export: (job: Job, args: string[]): void => {
        if (args.length === 0) {
            job.buffer.writeMany(job.environment.map((key, value) => `${key}=${value}`).join("\n"));
            return;
        }

        args.forEach(argument => {
            const [key, value] = argument.split("=");
            job.session.environment.set(key, value);
        });
    },
};

// A class representing built in commands
export default class Command {
    static allCommandNames = Object.keys(executors);

    static executor(command: string): (i: Job, args: string[]) => void {
        return executors[command];
    }

    static isBuiltIn(command: string): boolean {
        return this.allCommandNames.includes(command);
    }
}

export function expandHistoricalDirectory(alias: string, job: Job): string {
    if (alias === "-") {
        alias = "-1";
    }
    const stack = job.session.historicalCurrentDirectoriesStack;
    const index = stack.length - 1 + parseInt(alias, 10);

    if (index < 0) {
        throw new Error(`Error: you only have ${stack.length} ${pluralize("directory", stack.length)} in the stack.`);
    } else {
        return stack[index];
    }
}

export function isHistoricalDirectory(directory: string): boolean {
    return /^-\d*$/.test(directory);
}
