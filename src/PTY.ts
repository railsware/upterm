import * as ChildProcess from "child_process";
import * as OS from "os";
import * as _ from "lodash";
import * as pty from "pty.js";
import {baseName, resolveFile, exists, filterAsync, shell} from "./utils/Common";

const noConfigSwitches: Dictionary<string[]> = {
    zsh: ["--no-globalrcs", "--no-rcs"],
    bash: ["--noprofile", "--norc"],
};

function escapeArgument(argument: string) {
    if (argument.includes('"') || argument.includes(" ")) {
        return `'${argument}'`;
    } else if (argument.includes("'")) {
        return `"${argument}"`;
    } else {
        return argument;
    }
}

export default class PTY {
    private terminal: pty.Terminal;

    // TODO: write proper signatures.
    // TODO: use generators.
    // TODO: terminate. https://github.com/atom/atom/blob/v1.0.15/src/task.coffee#L151
    constructor(command: string, args: string[], env: ProcessEnvironment, dimensions: Dimensions, dataHandler: (d: string) => void, exitHandler: (c: number) => void) {
        this.terminal = pty.fork(shell(), [...noConfigSwitches[baseName(shell())], "-c", `${command} ${args.map(escapeArgument).join(" ")}`], {
            cols: dimensions.columns,
            rows: dimensions.rows,
            cwd: env.PWD,
            env: env,
        });

        this.terminal.on("data", (data: string) => dataHandler(data));
        this.terminal.on("exit", (code: number) => {
            exitHandler(code);
        });
    }

    write(data: string): void {
        this.terminal.write(data);
    }

    set dimensions(dimensions: Dimensions) {
        this.terminal.resize(dimensions.columns, dimensions.rows);
    }

    kill(signal: string): void {
        /**
         *  The if branch is necessary because pty.js doesn"t handle SIGINT correctly.
         *  You can test whether it works by executing
         *     ruby -e "loop { puts "yes"; sleep 1 }"
         *  and trying to kill it with SIGINT.
         *
         *  {@link https://github.com/chjj/pty.js/issues/58}
         */
        if (signal === "SIGINT") {
            this.terminal.kill("SIGTERM");
        } else {
            this.terminal.kill(signal);
        }
    }
}

export function executeCommand(command: string, args: string[] = [], directory: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const options = {
            env: _.extend({PWD: directory}, process.env),
            cwd: directory,
        };

        ChildProcess.exec(`${command} ${args.join(" ")}`, options, (error, output) => {
            if (error) {
                reject();
            } else {
                resolve(output);
            }
        });
    });
}

export async function linedOutputOf(command: string, args: string[], directory: string): Promise<string[]> {
    let output = await executeCommand(command, args, directory);
    return output.split(OS.EOL).filter(path => path.length > 0);
}

export async function executeCommandWithShellConfig(command: string): Promise<string[]> {
    const shellName = baseName(shell());
    const sourceCommands = (await existingConfigFiles(shellName)).map(fileName => `source ${fileName} &> /dev/null`);

    return await linedOutputOf(shell(), ["-c", `'${[...sourceCommands, command].join("; ")}'`], process.env.HOME);
}

async function existingConfigFiles(shellName: string): Promise<string[]> {
    const resolvedConfigFiles = configFiles(shellName).map(fileName => resolveFile(process.env.HOME, fileName));
    return await filterAsync(resolvedConfigFiles, exists);
}

function configFiles(shellName: string): string[] {
    switch (shellName) {
        case "zsh":
            return ["~/.zshrc", "~/.zsh_profile"];
        case "bash":
            return ["~/.bashrc", "~/.bash_profile"];
        default:
            throw `Unknown shell: ${shellName}`;
    }
}
