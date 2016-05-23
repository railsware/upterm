/* tslint:disable:no-unused-variable */
import * as React from "react";
import * as _ from "lodash";
import Session from "../Session";
import ApplicationComponent from "./1_ApplicationComponent";
import {titleBarHeight, letterWidth, rowHeight} from "./css/main";

export interface TabProps {
    isActive: boolean;
    activate: () => void;
    position: number;
    closeHandler: (event: KeyboardEvent) => void;
}

export const TabComponent = ({ isActive, activate, position, closeHandler }: TabProps) =>
    <li className={`tab ${isActive ? "active" : "inactive"}`} onClick={activate}>
        <span className="tabClose" onClick={closeHandler}/>
        <span className="commandSign">⌘</span>
        <span className="position">{position}</span>
    </li>;

export class Tab {
    public sessions: Session[] = [];
    private activeSessionIndex: number;

    constructor(private application: ApplicationComponent) {
        this.addSession();
    }

    addSession(): void {
        this.sessions.push(new Session(this.application, this.contentDimensions));
        this.activeSessionIndex = this.sessions.length - 1;
    }

    closeSession(session: Session): void {
        session.jobs.forEach(job => {
            job.removeAllListeners();
            job.interrupt();
        });
        session.removeAllListeners();

        _.pull(this.sessions, session);

        if (this.activeSessionIndex >= this.sessions.length) {
            this.activeSessionIndex = this.sessions.length - 1;
        }

    }

    activeSession(): Session {
        return this.sessions[this.activeSessionIndex];
    }

    activateSession(session: Session): void {
        this.activeSessionIndex = this.sessions.indexOf(session);
    }

    activatePreviousSession(): boolean {
        const isFirst = this.activeSessionIndex === 0;
        if (!isFirst) {
            this.activateSession(this.sessions[this.activeSessionIndex - 1]);
        }

        return isFirst;
    }

    activateNextSession(): boolean {
        const isLast = this.activeSessionIndex !== this.sessions.length - 1;
        if (isLast) {
            this.activateSession(this.sessions[this.activeSessionIndex + 1]);
        }

        return isLast;
    }

    updateAllSessionsDimensions(): void {
        for (const session of this.sessions) {
            session.dimensions = this.contentDimensions;
        }
    }

    private get contentDimensions(): Dimensions {
        return {
            columns: Math.floor(this.contentSize.width / letterWidth),
            rows: Math.floor(this.contentSize.height / rowHeight),
        };
    }

    private get contentSize(): Size {
        return {
            width: window.innerWidth,
            height: window.innerHeight - titleBarHeight,
        };
    }
}
