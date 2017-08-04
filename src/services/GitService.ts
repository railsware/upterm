import {Observable} from "rxjs/Observable";
import {Observer} from "rxjs/Observer";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import "rxjs/add/operator/share";
import "rxjs/add/operator/distinct";
import "rxjs/add/operator/multicast";

import {currentBranchName, GitDirectoryPath, repositoryState, RepositoryState} from "../utils/Git";

const INTERVAL = 2000;

async function getState(directory: string, callback: (state: GitState) => void) {
    const state = await repositoryState(directory);

    if (state === RepositoryState.NotRepository) {
        callback({kind: "not-repository"});
    } else {
        callback({
            kind: "repository",
            branch: await currentBranchName(<GitDirectoryPath>directory),
            status: state,
        });
    }
}

export class GitService {
    private observables: Map<string, Observable<GitState>> = new Map();

    observableFor(directory: string): Observable<GitState> {
        if (!this.observables.has(directory)) {
            const subscribe = (observer: Observer<GitState>) => {
                getState(directory, state => observer.next(state));
                const timer = setInterval(() => getState(directory, state => observer.next(state)), INTERVAL);

                return () => clearInterval(timer);
            };
            const observable = Observable.create(subscribe)
                // Don't emit if a value didn't change.
                .distinct(JSON.stringify)
                // Remember the last value to emit immediately to new subscriptions.
                .multicast(new BehaviorSubject<GitState>({kind: "not-repository"}))
                // Automatically stop checking git status when there are no subscriptions anymore.
                .refCount();

            this.observables.set(directory, observable);
        }

        return this.observables.get(directory)!;
    }
}
