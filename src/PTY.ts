import * as ChildProcess from "child_process";
import * as Invocation from "./Invocation";
import * as i from "./Interfaces";
const ptyInternalPath = require.resolve('./PTYInternal');

export default class PTY {
    private process: NodeJS.Process;

    // TODO: write proper signatures.
    // TODO: use generators.
    // TODO: terminate. https://github.com/atom/atom/blob/v1.0.15/src/task.coffee#L151
    constructor(command: string, args: string[], cwd: string, dimensions: i.Dimensions, dataHandler: Function, exitHandler: Function) {
        this.process = (<any>ChildProcess).fork(ptyInternalPath,
            [command, dimensions.columns, dimensions.rows, ...args],
            {env: process.env, cwd: cwd}
        );

        this.process.on('message', (message) => {
            if (message.hasOwnProperty('data')) {
                dataHandler(message.data);
            } else if (message.hasOwnProperty('exit')) {
                exitHandler(message.exit);
            } else {
                throw `Unhandled message: ${JSON.stringify(message)}`;
            }
        });
    }

    write(data: string): void {
        this.process.send({input: data});
    }

    set dimensions(dimensions: i.Dimensions) {
        this.process.send({resize: [dimensions.columns, dimensions.rows]});
    }

    kill(signal: string): void {
        this.process.send({signal: signal});
    }
}
