import Terminal from "../Terminal";
import PluginManager from "../PluginManager";
import {EnvironmentObserverPlugin} from "../Interfaces";
import Utils from "../Utils";
import {watch} from "chokidar";
import {FSWatcher} from "fs";
import * as Path from "path";
import {EventEmitter} from "events";
import {executeCommand} from "../PTY";
import {debounce} from "../Decorators";

const GIT_WATCHER_EVENT_NAME = "git-data-changed";

class GitWatcher extends EventEmitter {
    GIT_HEAD_FILE_NAME = Path.join(".git", "HEAD");
    GIT_HEADS_DIRECTORY_NAME = Path.join(".git", "refs", "heads");

    watcher: FSWatcher;
    gitDirectory: string;

    constructor(private directory: string) {
        super();
        this.gitDirectory = Path.join(this.directory, ".git");
    }

    destructor() {
        if (this.watcher) {
            this.watcher.close();
        }
    }

    async watch() {
        if (await Utils.exists(this.gitDirectory)) {
            this.updateGitData();
            this.watcher = watch(this.directory);
            this.watcher.on("all", (type: string, fileName: string) => {
                    if (!fileName.startsWith(".git") ||
                        fileName === this.GIT_HEAD_FILE_NAME ||
                        fileName.startsWith(this.GIT_HEADS_DIRECTORY_NAME)) {
                        this.updateGitData();
                    }
                }
            );
        } else {
            this.emit(GIT_WATCHER_EVENT_NAME, { isRepository: false });
        }
    }

    @debounce(1000 / 60)
    private async updateGitData() {
        let content = await Utils.readFile(Path.join(this.gitDirectory, "HEAD"));

        executeCommand("git", ["status", "--porcelain"], this.directory).then(changes => {
            const status = changes.length ? "dirty" : "clean";

            const data: VcsData = {
                isRepository: true,
                branch: /ref: refs\/heads\/(.*)/.exec(content)[1],
                status: status,
            };

            this.emit(GIT_WATCHER_EVENT_NAME, data);
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
            const watcher = new GitWatcher(directory);

            this.directoryToDetails.set(directory, {
                terminals: new Set([terminal]),
                watcher: watcher,
            });

            watcher.watch();

            watcher.on(GIT_WATCHER_EVENT_NAME, (event: string) => {
                this.directoryToDetails.get(directory).terminals.forEach(watchedTerminal =>
                    watchedTerminal.emit("vcs-data", event)
                );
            });
        }
    }
}

PluginManager.registerEnvironmentObserver(new WatchManager());
