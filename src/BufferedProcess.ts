import ChildProcess = require('child_process');
import path = require('path');
import events = require('events');
import _ = require('lodash');

class BufferedProcess extends events.EventEmitter {
	process: any = null;
	killed: boolean = false;

	constructor(command: string, args: string[], options: Object, stdout, stderr, exit) {
		super();

		var cmdArgs = [];
		var cmdOptions = {};

		if (!options) options = {};

		if (process.platform === 'win32') {
			cmdArgs = args.filter((arg) => {
				if (arg) return true;
			});
			cmdArgs = cmdArgs.map((arg) => {
				if(this.isExplorerCommand(command) && /^\/[a-zA-Z]+,.*$/.test(arg)) {
					/**
					 * Don't wrap /root,C:\folder style arguments to explorer calls in
                     * quotes since they will not be interpreted correctly if they are
                     */
					return arg;
				} else {
					/* Wrap in quotes the arg */
					return `\"${arg.toString().replace(/"/g, '\\"')}\"`;
				}
			});

			if (/\s/.test(command)) {
				cmdArgs.unshift(`\"${command}\"`);
			} else {
				cmdArgs.unshift(command);
			}

			cmdArgs = ['/s', '/c', cmdArgs.join(' ')];
			cmdOptions['windowsVerbatimArguments'] = true;

			this.execute(this.getCmdPath(), cmdArgs, cmdOptions);
		} else {
			this.execute(command, args, options);
		}

		this.handleEvents(stdout, stderr, exit);
	}

	execute(command: string, args: string[], options: Object): void {
		//console.log(command, args, options);
		
		try {
			this.process = ChildProcess.spawn(command, args, options);
		} catch(spawnError) {
			process.nextTick(() => {
				this.handleError(spawnError)
			});
		}
	}

	handleEvents(stdout, stderr, exit): void {
		if (!this.process) return;

		var stdoutClosed = true,
			stderrClosed = true,
			processExited = true,
			exitCode = 0;

		var triggerExitCallback = () => {
			if (this.killed) return;

			if (stdoutClosed && stderrClosed && processExited)
				exit();
		};

		if (stdout) {
			stdoutClosed = false;

			this.bufferStream(this.process.stdout, stdout, () => {
				stdoutClosed = true;
				triggerExitCallback();
			});
		}

		if (stderr) {
			stderrClosed = false;

			this.bufferStream(this.process.stderr, stderr, () => {
				stderrClosed = true;

				triggerExitCallback();
			});
		}

		this.process.on('error', (error) => this.handleError(error));
	}

	onError(callback): void {
		this.on('will-throw-error', callback);
	}

	handleError(error): any {
		this.emit('will-throw-error', { error: error });
	}

	bufferStream(stream, onLines, onDone): void {
		stream.setEncoding('utf8');
		var buffered = '';

		stream.on('data', (data) => {
			if (this.killed) return;

			buffered += data;

			var lastNewLineIndex = buffered.lastIndexOf('\n');
			if (lastNewLineIndex !== -1) {
				onLines(buffered.substring(0, lastNewLineIndex + 1));
				buffered = buffered.substring(lastNewLineIndex + 1);
			}
		});

		stream.on('close', () => {
			if (this.killed) return;

			if (buffered.length > 0) onLines(buffered);
			onDone();
		});
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

	isExplorerCommand(command: string): boolean {
		if (command === 'explorer.exe' || command === 'explorer') {
			return true;
		} else if (process.env.SystemRoot) {
			return command === path.join(process.env.SystemRoot, 'explorer.exe') 
				|| command === path.join(process.env.SystemRoot, 'explorer');
		} else {
			return false;
		}
	}

	kill(): void {
		if (this.killed) return;

		this.killed = true;

		if (process.platform === 'win32') this.killOnWindows();
		else this.killProcess();
	}

	killOnWindows(): void {
		if (!this.process) return;

		var pid = this.process.pid,
			cmd = 'wmic',
			args = [
				'process',
				'where',
				`(ParentProcessId=${pid})`,
				'get',
				'processid'
			],
			output = '';

		try {
			var wmicProcess = ChildProcess.spawn(cmd, args);

			wmicProcess.on('error', () => console.log(`Failed when trying to kill ${pid}`));
			wmicProcess.stdout.on('data', (data) => output += data);
			wmicProcess.stdout.on('close', () => {
				var pidsToKill = output.split(/\s+/)
					.filter((pid) => /^\d+$/.test(pid))
					.map((pid) => parseInt(pid));

				for (pid in pidsToKill) {
					try {
						process.kill(pid);
					} catch(error) {}
				}

				this.killProcess();
			});
		} catch(error) {
			this.killProcess();
		}
	}

	killProcess(): void {
		this.process.kill();
		this.process = null;
	}

}

export = BufferedProcess;