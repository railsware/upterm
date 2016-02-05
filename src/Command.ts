//import * as fs from "fs";
import Utils from "./Utils";
import Job from "./Job";
import {existsSync, statSync} from "fs";

const executors: Dictionary<(i: Job, a: string[]) => void> = {
    cd: (job: Job, args: string[]): void => {
        let newDirectory: string;

        if (!args.length) {
            newDirectory = Utils.homeDirectory;
        } else {
            newDirectory = Utils.resolveDirectory(job.directory, args[0]);

            if (!existsSync(newDirectory)) {
                throw new Error(`The directory ${newDirectory} doesn"t exist.`);
            }

            if (!statSync(newDirectory).isDirectory()) {
                throw new Error(`${newDirectory} is not a directory.`);
            }
        }

        job.terminal.currentDirectory = newDirectory;
    },
    clear: (job: Job, args: string[]): void => {
        setTimeout(() => job.terminal.clearJobs(), 0);
    },
    exit: (job: Job, args: string[]): void => {
        // FIXME.
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
