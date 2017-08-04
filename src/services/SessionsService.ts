import {Session, SessionID} from "../shell/Session";
import {ApplicationComponent} from "../views/ApplicationComponent";

export class SessionsService {
    private readonly sessions: Map<SessionID, Session> = new Map;

    create(application: ApplicationComponent) {
        const session = new Session(application);
        this.sessions.set(session.id, session);

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
