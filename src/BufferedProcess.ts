import ChildProcess = require('child_process');
import path = require('path');
import events = require('events');
import _ = require('lodash');

class BufferedProcess extends events.EventEmitter {
	process: any;

	constructor(command: string, args: string[], options?: Object) {
		super();

		var cmdArgs = [];
		var cmdOptions = {};
		if (process.platform === 'win32') {
			cmdArgs.push(args.join(' '));
			if (/\s/.test(command)) {
				cmdArgs.unshift(`\"${command}\"`);
			} else {
				cmdArgs.unshift(command);
			}

			cmdArgs = ['/s', '/c', cmdArgs.join(' ')];
			cmdOptions['windowsVerbatimArguments'] = true;

			this.execute(this.getCmdPath(), cmdArgs, cmdOptions);
		} else {
			this.execute(command, cmdArgs, cmdOptions);
		}

		this.handleEvents();
	}

	execute(command: string, args: string[], options: Object): void {
		console.log(command, args, options);
		this.process = ChildProcess.spawn(command, args, options);
	}

	handleEvents(): void {
		if (!this.process) return;

		console.log('handle events...');
	}

	getCmdPath(): string {
		if (process.env.comspec) {
			return process.env.comspec;
		}
		else if (process.env.SystemRoot) {
			return path.join(process.env.SystemRoot, 'System32', 'cmd.exe');
		}
		else return 'cmd.exe';
	}

	killProcess(): void {
		this.process.kill();
	}

}

export = BufferedProcess;