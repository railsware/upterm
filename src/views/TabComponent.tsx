/* tslint:disable:no-unused-variable */
import * as React from "react";
import * as _ from "lodash";
import Session from "../Session";
import ApplicationComponent from "./1_ApplicationComponent";
import * as css from "./css/main";
import {fontAwesome} from "./css/FontAwesome";

export interface TabProps {
    isActive: boolean;
    activate: () => void;
    position: number;
    closeHandler: (event: KeyboardEvent) => void;
}

export enum TabHoverState {
    Nothing,
    Tab,
    Close
}

interface TabState {
    hover: TabHoverState;
}

export class TabComponent extends React.Component<TabProps, TabState> {
    constructor() {
        super();
        this.state = {hover: TabHoverState.Nothing};
    }

    render() {
        return <li style={css.tab(this.state.hover !== TabHoverState.Nothing, this.props.isActive)}
                   onClick={this.props.activate}
                   onMouseEnter={() => this.setState({hover: TabHoverState.Tab})}
                   onMouseLeave={() => this.setState({hover: TabHoverState.Nothing})}>
            <span style={css.tabClose(this.state.hover)}
                  dangerouslySetInnerHTML={{__html: fontAwesome.times}}
                  onClick={this.props.closeHandler}
                  onMouseEnter={() => this.setState({hover: TabHoverState.Close})}
                  onMouseLeave={() => this.setState({hover: TabHoverState.Tab})}/>
            <span style={css.commandSign}>⌘</span>
            <span>{this.props.position}</span>
        </li>;
    }
}

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
            columns: Math.floor(this.contentSize.width / css.letterWidth),
            rows: Math.floor(this.contentSize.height / css.rowHeight),
        };
    }

    private get contentSize(): Size {
        return {
            width: window.innerWidth,
            height: window.innerHeight - css.titleBarHeight,
        };
    }
}
