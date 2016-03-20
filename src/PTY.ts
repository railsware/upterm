import * as ChildProcess from "child_process";
import * as OS from "os";
import {baseName, resolveFile, exists, filterAsync, shell} from "./Utils";
const ptyInternalPath = require.resolve("./PTYInternal");

interface Message {
    data?: string;
    exit?: number;
}

export default class PTY {
    private process: ChildProcess.ChildProcess;

    // TODO: write proper signatures.
    // TODO: use generators.
    // TODO: terminate. https://github.com/atom/atom/blob/v1.0.15/src/task.coffee#L151
    constructor(command: string, args: string[], env: ProcessEnvironment, dimensions: Dimensions, dataHandler: Function, exitHandler: Function) {
        this.process = ChildProcess.fork(
            ptyInternalPath,
            [command, dimensions.columns.toString(), dimensions.rows.toString(), ...args],
            {env: env, cwd: env.PWD}
        );

        this.process.on("message", (message: Message) => {
            if (message.hasOwnProperty("data")) {
                dataHandler(message.data);
            } else if (message.hasOwnProperty("exit")) {
                exitHandler(message.exit);
                this.process.disconnect();
            } else {
                throw `Unhandled message: ${JSON.stringify(message)}`;
            }
        });
    }

    write(data: string): void {
        this.process.send({input: data});
    }

    set dimensions(dimensions: Dimensions) {
        this.process.send({resize: [dimensions.columns, dimensions.rows]});
    }

    kill(signal: string): void {
        this.process.send({signal: signal});
    }
}

export function executeCommand(command: string, args: string[] = [], directory: string): Promise<string> {
    return new Promise((resolve, reject) => {
        let output = "";
        /* tslint:disable:no-unused-expression */
        new PTY(
            command,
            args,
            <ProcessEnvironment>_.extend({PWD: directory}, process.env),
            {columns: 80, rows: 20},
            (text: string) => output += text,
            (exitCode: number) => exitCode === 0 ? resolve(output) : reject(exitCode)
        );
    });
}

export async function linedOutputOf(command: string, args: string[], directory: string): Promise<string[]> {
    let output = await executeCommand(command, args, directory);
    return output.split(OS.EOL).filter(path => path.length > 0);
}

export async function executeCommandWithShellConfig(command: string): Promise<string[]> {
    const shellName = baseName(shell());
    const sourceCommands = (await existingConfigFiles(shellName)).map(fileName => `source ${fileName}`);

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
