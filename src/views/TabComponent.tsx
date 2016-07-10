/* tslint:disable:no-unused-variable */
import * as React from "react";
import * as _ from "lodash";
import {Session} from "../shell/Session";
import {ApplicationComponent} from "./1_ApplicationComponent";
import * as css from "./css/main";
import {fontAwesome} from "./css/FontAwesome";
import {ViewMapLeaf, ContainerType} from "../utils/ViewMapLeaf";

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

    public sessionsViewMapRoot: ViewMapLeaf<Session>;
    public sessionActiveLeaf: ViewMapLeaf<Session>;
    private activeSessionIndex: number;

    constructor(private application: ApplicationComponent) {
        this.addSession();
    }

    addSession(): void {
        var session = new Session(this.application, this.contentDimensions);
        this.sessions.push(session);

        this.sessionsViewMapRoot = new ViewMapLeaf<Session>();
        this.sessionsViewMapRoot.setValue(undefined);
        this.sessionsViewMapRoot.containerType = ContainerType.Row;

        this.sessionActiveLeaf = this.sessionsViewMapRoot.addLeaf(session);

        this.activeSessionIndex = this.sessions.length - 1;
    }

    /*
    $param {string} positionType - can have two values 'horizontal' or 'vertical'
    */
    addSessionToPosition(positionType: string): void {
        const session = new Session(this.application, this.contentDimensions);
        const activePosition = this.updateViewMap(positionType, this.sessionActiveLeaf, session);
        this.setActivePosition(activePosition);
        this.sessions.push(session);
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

        let foundSessionInViewMap = this.sessionsViewMapRoot.find(session);
        if (foundSessionInViewMap)
          this.sessionActiveLeaf = foundSessionInViewMap;
    }

    activatePreviousSession(): boolean {
        const isFirst = this.activeSessionIndex === 0;
        if (!isFirst) {
            this.activateSession(this.sessions[this.activeSessionIndex - 1]);
        }

        return !isFirst;
    }

    activateNextSession(): boolean {
        const isLast = this.activeSessionIndex === this.sessions.length - 1;
        if (!isLast) {
            this.activateSession(this.sessions[this.activeSessionIndex + 1]);
        }

        return !isLast;
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
            height: window.innerHeight - css.titleBarHeight - css.infoPanelHeight - css.outputPadding,
        };
    }

    /*
    $param {string} positionType - can have two values 'horizontal' or 'vertical'
    */
    private updateViewMap(positionType: string, activeLeaf: ViewMapLeaf<Session>, session: Session): ViewMapLeaf<Session> {
      if (positionType === "horizontal") {
        const parentLeaf = activeLeaf.getParent();
        if (parentLeaf.containerType === ContainerType.Row) {
          return parentLeaf.addLeaf(session);
        } else {
          //change current to row container
          const previousValue = activeLeaf.getValue();
          activeLeaf.removeValue();
          activeLeaf.containerType = ContainerType.Row;
          activeLeaf.addLeaf(previousValue);

          return activeLeaf.addLeaf(session);
        }
      } else if (positionType === "vertical") {
        const parentLeaf = activeLeaf.getParent();
        if (parentLeaf.containerType === ContainerType.Column) {
          return parentLeaf.addLeaf(session);
        } else {
          //change current Leaf to column container
          const previousValue = activeLeaf.getValue();
          activeLeaf.removeValue();
          activeLeaf.containerType = ContainerType.Column;
          activeLeaf.addLeaf(previousValue);

          return activeLeaf.addLeaf(session);
        }
      }

      throw "Incorrect positionType argument. Only 'horizontal' or 'vertical' are available.";
    }

    private setActivePosition(activeLeaf: ViewMapLeaf<Session>): void {
      this.sessionActiveLeaf = activeLeaf;
    }
}
