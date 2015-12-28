import Terminal from "../Terminal";
import PluginManager from "../PluginManager";
import {EnvironmentObserverPlugin} from "../Interfaces"
import EventEmitter = NodeJS.EventEmitter;
import Utils from "../Utils";
import * as fs from 'fs';
import * as Path from 'path';
import {executeCommand} from "../PTY";

class GitWatcher implements EnvironmentObserverPlugin {
    watches: Map<string, any>;
    gitBranchWatcher: fs.FSWatcher;
    gitLocked: boolean = false;

    constructor() {
        this.watches = new Map();

    }

    currentWorkingDirectoryWillChange() {
    }

    currentWorkingDirectoryDidChange(terminal: Terminal, directory: string) {
        if (this.gitBranchWatcher) {
            this.gitBranchWatcher.close();
        }

        var gitDirectory = Path.join(directory, '.git');
        const gitHeadFileName = Path.join('.git', 'HEAD');
        const gitHeadsDirectoryName = Path.join('.git', 'refs', 'heads');

        Utils.ifExists(gitDirectory, () => {
            this.updateGitData(terminal, directory, gitDirectory);
            this.gitBranchWatcher = fs.watch(directory, { recursive: true },
                (type, fileName) => {
                    if (!this.gitLocked && (!fileName.startsWith('.git') || fileName == gitHeadFileName || fileName.startsWith(gitHeadsDirectoryName))) {
                        this.updateGitData(terminal, directory, gitDirectory)
                    }
                }
            )
        }, () => terminal.emit('vcs-data', { isRepository: false }));
    }

    private updateGitData(terminal: Terminal, directory: string, gitDirectory: string) {
        this.gitLocked = true;

        fs.readFile(`${gitDirectory}/HEAD`, (error, buffer) => {
            executeCommand('git', ['status', '--porcelain'], directory).then(changes => {
                var status = changes.length ? 'dirty' : 'clean';

                var data: VcsData = {
                    isRepository: true,
                    branch: /ref: refs\/heads\/(.*)/.exec(buffer.toString())[1],
                    status: status
                };

                terminal.emit('vcs-data', data);
                this.gitLocked = false
            });
        });
    }
}

PluginManager.registerEnvironmentObserver(new GitWatcher());
