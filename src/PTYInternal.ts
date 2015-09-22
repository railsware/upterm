import * as pty from 'ptyw.js';

let commandName= process.argv[2];
let args = process.argv.slice(5);
let columns = parseInt(process.argv[3]);
let rows = parseInt(process.argv[4]);

var fork = pty.fork(process.env.SHELL, ['-c', `${commandName} ${args.join(' ')}`], {
    cols: columns,
    rows: rows,
    cwd: process.cwd(),
    env: process.env
});

interface IncomingMessage {
    input: string;
    resize: number[];
}

process.on('message', (message: IncomingMessage) => {
    if (message.hasOwnProperty('input')) {
        fork.write(message.input);
    } else if (message.hasOwnProperty('resize')) {
        fork.resize(message.resize[0], message.resize[1]);
    } else {
        throw `Unhandled incoming message: ${JSON.stringify(message)}`;
    }
});

fork.on('data', (data: string) => process.send({data: data}));
fork.on('exit', (code: number) => process.send({exit: code}));

