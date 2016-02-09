import Utils from "./Utils";
import Job from "./Job";
import {existsSync, statSync} from "fs";

const executors: Dictionary<(i: Job, a: string[]) => void> = {
    cd: (job: Job, args: string[]): void => {
        let newDirectory: string;

        if (!args.length) {
            newDirectory = Utils.homeDirectory;
        } else {
            let directory = args[0];

            if (/^-\d*$/.test(directory)) {
                if (directory === "-") {
                    directory = "-1";
                }
                const stack = job.session.historicalCurrentDirectoriesStack;
                const index = stack.length - 1 + parseInt(directory, 10);

                if (index < 0) {
                    throw new Error(`You only have ${stack.length} ${Utils.pluralize("directory", stack.length)} in the stack.`);
                } else {
                    newDirectory = stack[index];
                }
            } else {
                newDirectory = Utils.resolveDirectory(job.session.currentDirectory, directory);

                if (!existsSync(newDirectory)) {
                    throw new Error(`The directory ${newDirectory} doesn"t exist.`);
                }

                if (!statSync(newDirectory).isDirectory()) {
                    throw new Error(`${newDirectory} is not a directory.`);
                }
            }
        }

        job.session.currentDirectory = newDirectory;
    },
    clear: (job: Job, args: string[]): void => {
        setTimeout(() => job.session.clearJobs(), 0);
    },
    exit: (job: Job, args: string[]): void => {
        job.session.remove();
    },
};

// A class representing built in commands
export default class Command {

    static executor(command: string): (i: Job, args: string[]) => void {
        return executors[command];
    }

    static isBuiltIn(command: string): boolean {
        return ["cd", "clear", "exit"].includes(command);
    }
}
