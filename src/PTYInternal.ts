import * as pty from "pty.js";
import {baseName, shell} from "./utils/Common";

let commandName = process.argv[2];
let args = process.argv.slice(5);
let columns = parseInt(process.argv[3], 10);
let rows = parseInt(process.argv[4], 10);

const noConfigSwitches: Dictionary<string[]> = {
    zsh: ["--no-globalrcs", "--no-rcs"],
    bash: ["--noprofile", "--norc"],
};

const fork = pty.fork(shell(), [...noConfigSwitches[baseName(shell())], "-c", `${commandName} ${args.map(arg => `'${arg}'`).join(" ")}`], {
    cols: columns,
    rows: rows,
    cwd: process.cwd(),
    env: process.env,
});

interface IncomingMessage {
    input?: string;
    resize?: number[];
    signal?: string;
}

process.on("message", (message: IncomingMessage) => {
    if (message.hasOwnProperty("input")) {
        fork.write(message.input);
    } else if (message.hasOwnProperty("resize")) {
        fork.resize(message.resize[0], message.resize[1]);
    } else if (message.hasOwnProperty("signal")) {
        /**
         *  The if branch is necessary because pty.js doesn"t handle SIGINT correctly.
         *  You can test whether it works by executing
         *     ruby -e "loop { puts "yes"; sleep 1 }"
         *  and trying to kill it with SIGINT.
         *
         *  {@link https://github.com/chjj/pty.js/issues/58}
         */
        if (message.signal === "SIGINT") {
            fork.kill("SIGTERM");
        } else {
            fork.kill(message.signal);
        }
    } else {
        throw `Unhandled incoming message: ${JSON.stringify(message)}`;
    }
});

fork.on("data", (data: string) => process.send({ data: data }));
fork.on("exit", (code: number) => process.send({ exit: code }));
