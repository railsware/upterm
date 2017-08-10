import {Observable} from "rxjs/Observable";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import "rxjs/add/observable/timer";
import "rxjs/add/operator/concatMap";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/merge";
import "rxjs/add/operator/share";
import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/multicast";

import {currentBranchName, GitDirectoryPath, repositoryState, RepositoryState} from "../utils/Git";
import {services} from "./index";

const INTERVAL = 5000;

async function getState(directory: string): Promise<GitState> {
    const state = await repositoryState(directory);

    if (state === RepositoryState.NotRepository) {
        return {kind: "not-repository"};
    } else {
        return {
            kind: "repository",
            branch: await currentBranchName(<GitDirectoryPath>directory),
            status: state,
        };
    }
}

function createObservable(directory: string) {
    return Observable
        .timer(0, INTERVAL)
        .merge(services.sessions.jobFinishedObservable.filter(job => job.session.directory === directory))
        .concatMap(() => getState(directory))
        // Don't emit if a value didn't change.
        .distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y))
        // Remember the last value to emit immediately to new subscriptions.
        .multicast(new BehaviorSubject<GitState>({kind: "not-repository"}))
        // Automatically stop checking git status when there are no subscriptions anymore.
        .refCount();
}

export class GitService {
    private observables: Map<string, Observable<GitState>> = new Map();

    observableFor(directory: string): Observable<GitState> {
        if (!this.observables.has(directory)) {
            this.observables.set(directory, createObservable(directory));
        }

        return this.observables.get(directory)!;
    }
}
