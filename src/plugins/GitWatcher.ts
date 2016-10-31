import {Session} from "../shell/Session";
import {PluginManager} from "../PluginManager";
import {EnvironmentObserverPlugin} from "../Interfaces";
import {watch, FSWatcher} from "fs";
import * as Path from "path";
import * as _ from "lodash";
import {EventEmitter} from "events";
import {executeCommand} from "../PTY";
import {debounce} from "../Decorators";
import * as Git from "../utils/Git";

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
            this.updateGitData();
            this.watcher = watch(this.directory, <any>{
                recursive: true,
            });

            this.watcher.on(
                "change",
                (type: string, fileName: string) => {
                    if (!fileName.startsWith(".git") ||
                        fileName === this.GIT_HEAD_FILE_NAME ||
                        fileName.startsWith(this.GIT_HEADS_DIRECTORY_NAME)) {
                        this.updateGitData();
                    }
                }
            );
        } else {
            const data: VcsData = { kind: "not-repository" };
            this.emit(GIT_WATCHER_EVENT_NAME, data);
        }
    }

    @debounce(1000 / 60)
    private async updateGitData() {

        executeCommand("git", ["status", "-b", "--porcelain"], this.directory).then(changes => {
            const status: VcsStatus = (changes.split("\n").length > 2) ? "dirty" : "clean";
            console.log(changes);
            let head: string = changes.split(" ")[1];
            let push: string = "0";
            let pull: string = "0";

            let secondSplit: Array<string> = changes.split("[");
            if (secondSplit.length > 1) {
                let rawPushPull: string = secondSplit[1].slice(0, -2);
                let separatedPushPull: Array<string> = rawPushPull.split(", ");


                if (separatedPushPull.length > 0) {
                    for (let i in separatedPushPull) {
                        if (separatedPushPull.hasOwnProperty(i)) {
                            let splitAgain: Array<string> = separatedPushPull[i].split(" ");
                            switch (splitAgain[0]) {
                                case "ahead":
                                    push = splitAgain[1];
                                    break;
                                case "behind":
                                    pull = splitAgain[1];
                                    break;
                                default:
                                    break;
                            }
                        }
                    }
                }
            }

            let fileChanges = linesToFileChanges(changes);

            const data: VcsData = {
                kind: "repository",
                branch: head,
                push: push,
                pull: pull,
                status: status,
                changes: fileChanges,
            };

            this.emit(GIT_WATCHER_EVENT_NAME, data);
        });
    }
}
function linesToFileChanges(lines: string): FileChanges {
  let stagedChanges = new Map<string, number>([["+", 0], ["~", 0], ["-", 0], ["!", 0]]);
  let unstagedChanges = new Map<string, number>([["+", 0], ["~", 0], ["-", 0], ["!", 0]]);
  lines.split("\n").slice(1).forEach((line) => {
    switch (line[0]) {
      case "A": stagedChanges.set("+", stagedChanges.get("+") + 1); break;
      case "M":
      case "R":
      case "C": stagedChanges.set("~", stagedChanges.get("~") + 1); break;
      case "D": stagedChanges.set("-", stagedChanges.get("-") + 1); break;
      case "U": stagedChanges.set("!", stagedChanges.get("!") + 1); break;
      default: break;
    }

    switch (line[1]) {
      case "?":
      case "A": unstagedChanges.set("+", stagedChanges.get("+") + 1); break;
      case "M": unstagedChanges.set("~", stagedChanges.get("~") + 1); break;
      case "D": unstagedChanges.set("-", stagedChanges.get("-") + 1); break;
      case "U": unstagedChanges.set("!", stagedChanges.get("!") + 1); break;
      default: break;
    }
  });
  let stagedResult: string = [...stagedChanges]
    .filter((pair) => (pair[1] !== 0))
    .map(([key, v]) => (key + String(v) + " "))
    .reduce((left, right) => (left + right), "");
  let unstagedResult: string = [...unstagedChanges]
    .filter((pair) => (pair[1] !== 0))
    .map(([key, v]) => key + String(v) + " ")
    .reduce((left, right) => left + right, "");
  return {stagedChanges: stagedResult, unstagedChanges: unstagedResult};
}


interface WatchesValue {
    listeners: Set<Session>;
    watcher: GitWatcher;
    data: VcsData;
}

class WatchManager implements EnvironmentObserverPlugin {
    directoryToDetails: Map<string, WatchesValue> = new Map();

    presentWorkingDirectoryWillChange(session: Session, newDirectory: string) {
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
