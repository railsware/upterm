import {Session} from "../shell/Session";
import {PluginManager} from "../PluginManager";
import {EnvironmentObserverPlugin} from "../Interfaces";
import * as _ from "lodash";
import {EventEmitter} from "events";
import {currentBranchName, GitDirectoryPath, repositoryState, RepositoryState} from "../utils/Git";

const GIT_WATCHER_EVENT_NAME = "git-data-changed";

class GitWatcher extends EventEmitter {
    timer: NodeJS.Timer;

    constructor(private directory: string) {
        super();
    }

    stopWatching() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }

    watch() {
        this.updateGitData();
        this.timer = setInterval(() => this.updateGitData(), 5000);
    }

    private async updateGitData() {
        const state = await repositoryState(this.directory);

        if (state === RepositoryState.NotRepository) {
            const data: VcsData = { kind: "not-repository" };
            this.emit(GIT_WATCHER_EVENT_NAME, data);
        } else {
            const data: VcsData = {
                kind: "repository",
                branch: await currentBranchName(<GitDirectoryPath>this.directory),
                status: state,
            };
            this.emit(GIT_WATCHER_EVENT_NAME, data);
        }
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
