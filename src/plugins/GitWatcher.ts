import {Session} from "../shell/Session";
import {PluginManager} from "../PluginManager";
import {EnvironmentObserverPlugin} from "../Interfaces";
import {watch, FSWatcher} from "fs";
import * as Path from "path";
import * as _ from "lodash";
import {EventEmitter} from "events";
import {debounce} from "../Decorators";
import * as Git from "../utils/Git";
import {currentBranchName, GitDirectoryPath, hasUncommittedChanges} from "../utils/Git";

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

    stopWatching() {
        if (this.watcher) {
            this.watcher.close();
        }
    }

    watch() {
        if (Git.isGitDirectory(this.directory)) {
            this.updateGitData(this.directory);
            this.watcher = watch(this.directory, <any>{
                recursive: true,
            });

            this.watcher.on(
                "change",
                (_type: string, fileName: string) => {
                    if (!fileName.startsWith(".git") ||
                        fileName === this.GIT_HEAD_FILE_NAME ||
                        fileName.startsWith(this.GIT_HEADS_DIRECTORY_NAME)) {
                        if (Git.isGitDirectory(this.directory)) {
                            this.updateGitData(this.directory);
                        }
                    }
                },
            );
        } else {
            const data: VcsData = { kind: "not-repository" };
            this.emit(GIT_WATCHER_EVENT_NAME, data);
        }
    }

    @debounce(1000 / 60)
    private async updateGitData(directory: GitDirectoryPath) {
        const data: VcsData = {
            kind: "repository",
            branch: await currentBranchName(directory),
            status: (await hasUncommittedChanges(directory) ? "dirty" : "clean"),
        };

        this.emit(GIT_WATCHER_EVENT_NAME, data);
    }
}

interface WatchesValue {
    listeners: Set<Session>;
    watcher: GitWatcher;
    data: VcsData;
}

class WatchManager implements EnvironmentObserverPlugin {
    directoryToDetails: Map<string, WatchesValue> = new Map();

    presentWorkingDirectoryWillChange(session: Session, _newDirectory: string) {
        const oldDirectory = session.directory;

        if (!this.directoryToDetails.has(oldDirectory)) {
            return;
        }

        const details = this.directoryToDetails.get(oldDirectory)!;
        details.listeners.delete(session);

        if (details.listeners.size === 0) {
            details.watcher.stopWatching();
            this.directoryToDetails.delete(oldDirectory);
        }
    }

    presentWorkingDirectoryDidChange(session: Session, directory: string) {
        const existingDetails = this.directoryToDetails.get(directory);

        if (existingDetails) {
            existingDetails.listeners.add(session);
        } else {
            const watcher = new GitWatcher(directory);

            this.directoryToDetails.set(directory, {
                listeners: new Set([session]),
                watcher: watcher,
                data: { kind: "not-repository" },
            });

            watcher.watch();

            watcher.on(GIT_WATCHER_EVENT_NAME, (data: VcsData) => {
                const details = this.directoryToDetails.get(directory);

                if (details && !_.isEqual(data, details.data)) {
                    details.data = data;
                    details.listeners.forEach(listeningSession => listeningSession.emit("vcs-data"));
                }
            });
        }
    }

    vcsDataFor(directory: string): VcsData {
        const details = this.directoryToDetails.get(directory);

        if (details) {
            return details.data;
        } else {
            return { kind: "not-repository" };
        }
    }
}

export const watchManager = new WatchManager();

PluginManager.registerEnvironmentObserver(watchManager);
