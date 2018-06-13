import {type as osType} from "os";
import * as classNames from "classnames";
import {TabHeaderComponent, Props} from "./TabHeaderComponent";
import * as React from "react";
import {ipcRenderer} from "electron";
import {remote} from "electron";
import * as css from "./css/styles";
import {SearchComponent} from "./SearchComponent";
import {TabComponent} from "./TabComponent";
import {SessionID} from "../shell/Session";
import {services} from "../services";
import * as _ from "lodash";
import {NavButtonsComponent} from "./NavButtonsComponent";

type ApplicationState = {
    tabs: Array<{id: number, sessionIDs: SessionID[]; focusedSessionID: SessionID}>;
    focusedTabIndex: number;
};

export class ApplicationComponent extends React.Component<{}, ApplicationState> {
    tabComponents: TabComponent[];

    constructor(props: {}) {
        super(props);

        const sessionID = services.sessions.create();
        this.state = {
            tabs: [{
                id: Date.now(),
                sessionIDs: [sessionID],
                focusedSessionID: sessionID,
            }],
            focusedTabIndex: 0,
        };

        services.window.onResize.subscribe(() => this.resizeAllSessions());
        services.window.onClose.subscribe(() => services.sessions.closeAll());
        services.sessions.onClose.subscribe(id => this.removeSessionFromState(id));
        services.font.onChange.subscribe(() => {
            this.forceUpdate();
            this.resizeAllSessions();
        });

        ipcRenderer.on("change-working-directory", (_event: Event, directory: string) =>
            this.focusedSession.directory = directory,
        );
    }

    render() {
        let tabs: React.ReactElement<Props>[] | undefined;

        if (this.state.tabs.length > 1) {
            tabs = this.state.tabs.map((tab, index: number) =>
                <TabHeaderComponent
                    isFocused={index === this.state.focusedTabIndex}
                    key={tab.id}
                    position={index + 1}
                    activate={() => this.setState({focusedTabIndex: index})}
                    closeHandler={(event: React.MouseEvent<HTMLSpanElement>) => {
                        services.sessions.close(this.state.tabs[index].sessionIDs);
                        event.stopPropagation();
                        event.preventDefault();
                    }}
                />,
            );
        }

        this.tabComponents = [];

        return (
            <div className="application" style={css.application()}>
                <div className={classNames("title-bar", {"reversed": this.isMacOS()})}>
                    <SearchComponent/>
                    <ul className="tabs">{tabs}</ul>
                    <NavButtonsComponent
                        minimize={(event: React.MouseEvent<HTMLSpanElement>) => {
                            let window = remote.getCurrentWindow();
                            event.stopPropagation();
                            window.minimize();
                        }}
                        maximize={(event: React.MouseEvent<HTMLSpanElement>) => {
                            let window = remote.getCurrentWindow();
                            event.stopPropagation();
                            if (this.isMacOS()) {
                                if (window.isFullScreen()) {
                                    window.setFullScreen(false);
                                } else {
                                    window.setFullScreen(true);
                                }
                            } else {
                                if (window.isMaximized()) {
                                    window.restore();
                                } else {
                                    window.maximize();
                                }
                            }
                        }}
                        close={(event: React.MouseEvent<HTMLSpanElement>) => {
                            let window = remote.getCurrentWindow();
                            event.stopPropagation();
                            window.close();
                        }}
                    />
                </div>
                {this.state.tabs.map((tabProps, index) =>
                    <TabComponent {...tabProps}
                                  isFocused={index === this.state.focusedTabIndex}
                                  key={tabProps.id}
                                  onSessionFocus={(id: SessionID) => {
                                      const state = this.cloneState();
                                      state.tabs[state.focusedTabIndex].focusedSessionID = id;
                                      this.setState(state);
                                  }}
                                  ref={tabComponent => this.tabComponents[index] = tabComponent!}/>)}
            </div>
        );
    }

    /**
     * is Mac OS
     */

    isMacOS() {
      return "Darwin" === osType();
    }

    /**
     * Tab methods.
     */

    get focusedTabComponent() {
        return this.tabComponents[this.state.focusedTabIndex];
    }

    addTab(): void {
        if (this.state.tabs.length < 9) {
            const id = services.sessions.create();

            const state = this.cloneState();
            state.tabs.push({
                id: Date.now(),
                sessionIDs: [id],
                focusedSessionID: id,
            });
            state.focusedTabIndex = state.tabs.length - 1;

            this.setState(state);
        } else {
            remote.shell.beep();
        }
    }

    focusPreviousTab() {
        if (this.state.focusedTabIndex !== 0) {
            this.focusTab(this.state.focusedTabIndex - 1);
        }
    }

    focusNextTab() {
        if (this.state.focusedTabIndex !== this.state.tabs.length - 1) {
            this.focusTab(this.state.focusedTabIndex + 1);
        }
    }

    focusTab(index: number): void {
        if (index === 8) {
            index = this.state.tabs.length - 1;
        }

        if (this.state.tabs.length > index) {
            this.setState({focusedTabIndex: index});
        } else {
            remote.shell.beep();
        }
    }

    closeFocusedTab() {
        const sessionIDs = this.state.tabs[this.state.focusedTabIndex].sessionIDs;
        services.sessions.close(sessionIDs);
    }

    /**
     * Session methods.
     */

    get focusedSession() {
        return services.sessions.get(this.state.tabs[this.state.focusedTabIndex].focusedSessionID);
    }

    closeFocusedSession() {
        services.sessions.close(this.focusedSession.id);
    }

    otherSession(): void {
        const state = this.cloneState();
        const tabState = state.tabs[state.focusedTabIndex];

        if (tabState.sessionIDs.length < 2) {
            const id = services.sessions.create();
            tabState.sessionIDs.push(id);
            tabState.focusedSessionID = id;

            this.setState(state, () => this.resizeTabSessions(state.focusedTabIndex));
        } else {
            tabState.focusedSessionID = tabState.sessionIDs.find(id => id !== tabState.focusedSessionID)!;
            this.setState(state);
        }
    }

    private resizeTabSessions(tabIndex: number): void {
        this.tabComponents[tabIndex].sessionComponents.forEach(sessionComponent => sessionComponent.resizeSession());
    }

    private resizeAllSessions() {
        this.tabComponents.forEach(tabComponent => {
            tabComponent.sessionComponents.forEach(sessionComponent => sessionComponent.resizeSession());
        });
    }

    private removeSessionFromState(id: SessionID) {
        const state = this.cloneState();
        const tabIndex = state.tabs.findIndex(tabState => tabState.sessionIDs.includes(id));
        const tabState = state.tabs[tabIndex];

        if (tabState.sessionIDs.length === 1) {
            this.removeTabFromState(tabIndex);
        } else {
            const sessionIndex = tabState.sessionIDs.findIndex(id => id === tabState.focusedSessionID);
            tabState.sessionIDs.splice(sessionIndex, 1);
            tabState.focusedSessionID = tabState.sessionIDs[0];

            this.setState(state, () => this.resizeTabSessions(tabIndex));
        }
    }

    private removeTabFromState(index: number): void {
        const state = this.cloneState();

        state.tabs.splice(index, 1);
        state.focusedTabIndex = Math.max(0, index - 1);

        if (state.tabs.length === 0) {
            ipcRenderer.send("quit");
        } else {
            this.setState(state);
        }
    }

    /**
     * Return a deep clone of the state in order not to
     * accidentally mutate it.
     */
    private cloneState(): ApplicationState {
        return _.cloneDeep(this.state);
    }
}
