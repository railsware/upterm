import Terminal from "../Terminal";
import PluginManager from "../PluginManager";
import {EnvironmentObserverPlugin} from "../Interfaces"
import EventEmitter = NodeJS.EventEmitter;
import Utils from "../Utils";
import * as fs from 'fs';
import * as Path from 'path';
import * as events from 'events';
import {executeCommand} from "../PTY";

const GIT_WATCHER_EVENT_NAME = 'git-data-changed';

class GitWatcher extends events.EventEmitter {
    GIT_HEAD_FILE_NAME = Path.join('.git', 'HEAD');
    GIT_HEADS_DIRECTORY_NAME = Path.join('.git', 'refs', 'heads');

    gitBranchWatcher: fs.FSWatcher;
    gitLocked: boolean = false;
    gitDirectory: string;

    constructor(private directory: string) {
        super();
        this.gitDirectory = Path.join(this.directory, '.git');
    }

    destructor() {
        if (this.gitBranchWatcher) {
            this.gitBranchWatcher.close();
        }
    }

    watch() {
        Utils.ifExists(this.gitDirectory,
            () => {
                this.updateGitData();
                this.gitBranchWatcher = fs.watch(this.directory, { recursive: true },
                    (type, fileName) => {
                        if (!this.gitLocked && (!fileName.startsWith('.git') || fileName == this.GIT_HEAD_FILE_NAME || fileName.startsWith(this.GIT_HEADS_DIRECTORY_NAME))) {
                            this.updateGitData()
                        }
                    }
                )
            },
            () => this.emit(GIT_WATCHER_EVENT_NAME, { isRepository: false })
        );
    }

    private updateGitData() {
        this.gitLocked = true;

        fs.readFile(`${this.gitDirectory}/HEAD`, (error, buffer) => {
            executeCommand('git', ['status', '--porcelain'], this.directory).then(changes => {
                var status = changes.length ? 'dirty' : 'clean';

                var data: VcsData = {
                    isRepository: true,
                    branch: /ref: refs\/heads\/(.*)/.exec(buffer.toString())[1],
                    status: status
                };

                this.emit(GIT_WATCHER_EVENT_NAME, data);
                this.gitLocked = false
            });
        });
    }
}

interface WatchesValue {
    terminals: Set<Terminal>;
    watcher: GitWatcher;
}

class WatchManager implements EnvironmentObserverPlugin {
    directoryToDetails: Map<string, WatchesValue> = new Map();

    currentWorkingDirectoryWillChange(terminal: Terminal, directory: string) {
        if (!this.directoryToDetails.has(directory)) {
            return;
        }

        const details = this.directoryToDetails.get(directory);
        details.terminals.delete(terminal);

        if (details.terminals.size === 0) {
            details.watcher.destructor();
            this.directoryToDetails.delete(directory);
        }
    }

    currentWorkingDirectoryDidChange(terminal: Terminal, directory: string) {
        if (this.directoryToDetails.has(directory)) {
            this.directoryToDetails.get(directory).terminals.add(terminal);
        } else {
            const watcher = new GitWatcher(directory) ;

            this.directoryToDetails.set(directory, {
                terminals: new Set([terminal]),
                watcher: watcher
            });

            watcher.watch();

            watcher.on(GIT_WATCHER_EVENT_NAME, (event: any) => {
                //console.log(`Emitted for directory ${directory}: ${JSON.stringify(event)}`);
                this.directoryToDetails.get(directory).terminals.forEach(terminal =>
                    terminal.emit('vcs-data', event)
                );
            })
        }
    }
}

PluginManager.registerEnvironmentObserver(new WatchManager());
