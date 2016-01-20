import * as _ from "lodash";
import * as fs from "fs";
import Utils from "./Utils";
import Job from "./Job";
import Application from "./Application";

const executors: _.Dictionary<(i: Job, a: string[]) => void> = {
    cd: (job: Job, args: string[]): void => {
        let newDirectory: string;

        if (!args.length) {
            newDirectory = Utils.homeDirectory;
        } else {
            newDirectory = Utils.resolveDirectory(job.directory, args[0]);

            if (!fs.existsSync(newDirectory)) {
                throw new Error(`The directory ${newDirectory} doesn"t exist.`);
            }

            if (!fs.statSync(newDirectory).isDirectory()) {
                throw new Error(`${newDirectory} is not a directory.`);
            }
        }

        job.terminal.currentDirectory = newDirectory;
    },
    clear: (job: Job, args: string[]): void => {
        setTimeout(() => job.terminal.clearJobs(), 0);
    },
    exit: (job: Job, args: string[]): void => {
        const application = Application.instance;
        application
            .removeTerminal(application.activeTerminal)
            .activateTerminal(_.last(application.terminals));
    },
};

// A class representing built in commands
export default class Command {

    static executor(command: string): (i: Job, args: string[]) => void {
        return executors[command];
    }

    static isBuiltIn(command: string): any {
        return ["cd", "clear", "exit"].includes(command);
    }
}
