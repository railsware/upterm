import {Job} from "./Job";
import {existsSync, statSync} from "fs";
import {homeDirectory, pluralize, resolveDirectory, resolveFile, mapObject} from "../utils/Common";
import {readFileSync} from "fs";
import {EOL} from "os";
import {Session} from "./Session";
import {OrderedSet} from "../utils/OrderedSet";
import {parseAlias} from "./Aliases";

const executors: Dictionary<(i: Job, a: string[]) => void> = {
    cd: (job: Job, args: string[]): void => {
        let fullPath: string;

        if (!args.length) {
            fullPath = homeDirectory;
        } else {
            const enteredPath = args[0];

            if (isHistoricalDirectory(enteredPath)) {
                fullPath = expandHistoricalDirectory(enteredPath, job.session.historicalPresentDirectoriesStack);
            } else {
                fullPath = job.environment.cdpath
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
            job.screenBuffer.writeMany(job.environment.map((key, value) => `${key}=${value}`).join("\r\n"));
        } else {
            args.forEach(argument => {
                const firstEqualIndex = argument.indexOf("=");
                const key = argument.slice(0, firstEqualIndex);
                const value = argument.slice(firstEqualIndex + 1);

                job.session.environment.set(key, value);
            });
        }
    },
    // FIXME: make the implementation more reliable.
    source: (job: Job, args: string[]): void => {
        sourceFile(job.session, args[0]);
    },
    alias: (job: Job, args: string[]): void => {
        if (args.length === 0) {
            job.screenBuffer.writeMany(mapObject(job.session.aliases.toObject(), (key, value) => `${key}=${value}`).join("\r\n"));
        } else if (args.length === 1) {
            const parsed = parseAlias(args[0]);
            job.session.aliases.add(parsed.name, parsed.value);
        } else {
            throw `Don't know what to do with ${args.length} arguments.`;
        }
    },
    unalias: (job: Job, args: string[]): void => {
        if (args.length === 1) {
            const name = args[0];

            if (job.session.aliases.has(name)) {
                job.session.aliases.remove(args[0]);
            } else {
                throw `There is such alias: ${name}.`;
            }
        } else {
            throw `Don't know what to do with ${args.length} arguments.`;
        }
    },
    show: (job: Job, args: string[]): void => {
        job.screenBuffer.writeMany(args.join("\r\n"));
    }
};

export function sourceFile(session: Session, fileName: string) {
    const content = readFileSync(resolveFile(session.directory, fileName)).toString();

    content.split(EOL).forEach(line => {
        if (line.startsWith("export ")) {
            const [key, value] = line.split(" ")[1].split("=");
            session.environment.set(key, value);
        }
    });
}

// A class representing built in commands
export class Command {
    static allCommandNames = Object.keys(executors);

    static executor(command: string): (i: Job, args: string[]) => void {
        return executors[command];
    }

    static isBuiltIn(command: string): boolean {
        return this.allCommandNames.includes(command);
    }
}

export function expandHistoricalDirectory(alias: string, historicalDirectories: OrderedSet<string>): string {
    if (alias === "-") {
        alias = "-1";
    }
    const index = historicalDirectories.size + parseInt(alias, 10);

    if (index < 0) {
        throw new Error(`Error: you only have ${historicalDirectories.size} ${pluralize("directory", historicalDirectories.size)} in the stack.`);
    } else {
        const directory = historicalDirectories.at(index);

        if (directory) {
            return directory;
        } else {
            throw `No directory with index ${index}`;
        }
    }
}

export function isHistoricalDirectory(directory: string): boolean {
    return /^-\d*$/.test(directory);
}
