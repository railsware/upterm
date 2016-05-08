import Job from "./Job";
import {existsSync, statSync} from "fs";
import {homeDirectory, pluralize, resolveDirectory, resolveFile} from "./utils/Common";
import {readFileSync} from "fs";
import {EOL} from "os";

const executors: Dictionary<(i: Job, a: string[]) => void> = {
    cd: (job: Job, args: string[]): void => {
        let fullPath: string;

        if (!args.length) {
            fullPath = homeDirectory();
        } else {
            const enteredPath = args[0];

            if (isHistoricalDirectory(enteredPath)) {
                fullPath = expandHistoricalDirectory(enteredPath, job.session.historicalCurrentDirectoriesStack);
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
        job.session.close();
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
    // FIXME: make the implementation more reliable.
    source: (job: Job, args: string[]): void => {
        const content = readFileSync(resolveFile(job.session.directory, args[0])).toString();

        content.split(EOL).forEach(line => {
            if (line.startsWith("export ")) {
                const [key, value] = line.split(" ")[1].split("=");
                job.session.environment.set(key, value);
            }
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

export function expandHistoricalDirectory(alias: string, stack: string[]): string {
    if (alias === "-") {
        alias = "-1";
    }
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
