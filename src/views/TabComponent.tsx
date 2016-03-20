/* tslint:disable:no-unused-variable */
import * as React from "react";
import Session from "../Session";
import ApplicationComponent from "./1_ApplicationComponent";

export interface TabProps {
    isActive: boolean;
    activate: () => void;
    position: number;
}

export const TabComponent = ({ isActive, activate, position }: TabProps) =>
    <li className={`tab ${isActive ? "active" : "inactive"}`} onClick={activate}>
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
            columns: Math.floor(this.contentSize.width / this.charSize.width),
            rows: Math.floor(this.contentSize.height / this.charSize.height),
        };
    }

    private get contentSize(): Size {
        const titleBarHeight = 24; // Make sure it's the same as $title-bar-height SCSS variable.
        return {
            width: window.innerWidth,
            height: window.innerHeight - titleBarHeight,
        };
    }

    private get charSize(): Size {
        const letter = document.getElementById("sizes-calculation");

        return {
            width: letter.clientWidth + 0.5,
            height: letter.clientHeight,
        };
    };
}
