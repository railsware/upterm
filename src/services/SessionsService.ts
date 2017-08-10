import {Session, SessionID} from "../shell/Session";
import {ApplicationComponent} from "../views/ApplicationComponent";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import "rxjs/add/observable/fromEvent";
import * as _ from "lodash";
import {Job} from "../shell/Job";


export class SessionsService {
    readonly jobFinishedObservable = new Subject<Job>();
    private readonly sessions: Map<SessionID, Session> = new Map;

    create(application: ApplicationComponent) {
        const session = new Session(application);
        this.sessions.set(session.id, session);

        Observable.fromEvent(session, "job-finished").subscribe(
            () => this.jobFinishedObservable.next(_.last(session.jobs)!),
        );

        return session.id;
    }

    get(id: SessionID) {
        return this.sessions.get(id)!;
    }

    close(id: SessionID) {
        const session = this.get(id);

        session.jobs.forEach(job => {
            job.removeAllListeners();
            job.interrupt();
        });

        session.removeAllListeners();

        this.sessions.delete(id);
    }

    closeAll() {
        for (const id of this.sessions.keys()) {
            this.close(id);
        }
    }
}
