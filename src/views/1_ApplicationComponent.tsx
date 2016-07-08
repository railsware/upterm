import {SessionComponent} from "./2_SessionComponent";
import {TabComponent, TabProps, Tab} from "./TabComponent";
import * as React from "react";
import * as _ from "lodash";
import {Session} from "../shell/Session";
import {ipcRenderer} from "electron";
import {KeyCode, Status} from "../Enums";
import {remote} from "electron";
import * as css from "./css/main";
import {saveWindowBounds} from "./ViewUtils";
import {StatusBarComponent} from "./StatusBarComponent";

export class ApplicationComponent extends React.Component<{}, {}> {
    private tabs: Tab[] = [];
    private activeTabIndex: number;

    constructor(props: {}) {
        super(props);
        const electronWindow = remote.BrowserWindow.getAllWindows()[0];

        this.addTab();

        electronWindow
            .on("move", () => saveWindowBounds(electronWindow))
            .on("resize", () => {
                saveWindowBounds(electronWindow);
                this.recalculateDimensions();
            })
            .webContents
            .on("devtools-opened", () => this.recalculateDimensions())
            .on("devtools-closed", () => this.recalculateDimensions());

        ipcRenderer.on("change-working-directory", (event: Electron.IpcRendererEvent, directory: string) =>
            this.activeTab.activeSession().directory = directory
        );

        window.onbeforeunload = () => {
            electronWindow
                .removeAllListeners()
                .webContents
                .removeAllListeners("devtools-opened")
                .removeAllListeners("devtools-closed");

            this.closeAllTabs();
        };
    }

    handleKeyDown(event: KeyboardEvent) {
        if (event.metaKey && event.keyCode === KeyCode.Underscore) {
            this.activeTab.addSession();
            this.forceUpdate();
            event.stopPropagation();
        }

        if (event.metaKey && event.keyCode === KeyCode.VerticalBar) {
            console.log("Split vertically.");

            event.stopPropagation();
        }

        if (event.ctrlKey && event.keyCode === KeyCode.D) {
            const activeSession = this.activeTab.activeSession();

            if (activeSession.currentJob.status !== Status.InProgress) {
                this.closeSession(activeSession);

                this.forceUpdate();
                event.stopPropagation();
            }
        }

        if (event.metaKey && event.keyCode === KeyCode.W) {
            this.closeSession(this.activeTab.activeSession());

            this.forceUpdate();
            event.stopPropagation();
            event.preventDefault();
        }

        if (event.metaKey && event.keyCode === KeyCode.J) {
            if (this.activeTab.activateNextSession()) {
                this.forceUpdate();
                event.stopPropagation();
            }
        }

        if (event.metaKey && event.keyCode === KeyCode.K) {
            if (this.activeTab.activatePreviousSession()) {
                this.forceUpdate();
                event.stopPropagation();
            }
        }

        if (event.metaKey && event.keyCode === KeyCode.T) {
            if (this.tabs.length < 9) {
                this.addTab();
                this.forceUpdate();
            } else {
                remote.shell.beep();
            }

            event.stopPropagation();
        }

        if (event.metaKey && event.keyCode >= KeyCode.One && event.keyCode <= KeyCode.Nine) {
            const newTabIndex = (event.keyCode === KeyCode.Nine ? this.tabs.length : parseInt(event.key, 10)) - 1;

            if (this.tabs.length > newTabIndex) {
                this.activeTabIndex = newTabIndex;
                this.forceUpdate();
            } else {
                remote.shell.beep();
            }

            event.stopPropagation();
        }
    }

    render() {
        let tabs: React.ReactElement<TabProps>[] | undefined;

        if (this.tabs.length > 1) {
            tabs = this.tabs.map((tab: Tab, index: number) =>
                <TabComponent isActive={index === this.activeTabIndex}
                              key={index}
                              position={index + 1}
                              activate={() => {
                                this.activeTabIndex = index;
                                this.setState({ sessions: this.activeTab.sessions });
                              }}
                              closeHandler={this.createCloseTabHandler(index)}>
                </TabComponent>
            );
        }

        let sessions = _.flatten(this.activeTab.sessions.map((session, index) => {
                const isActive = session === this.activeTab.activeSession();

                const sessionComponent = (
                    <SessionComponent session={session}
                                      key={session.id}
                                      style={css.session(isActive, index)}
                                      isActive={isActive}
                                      updateStatusBar={isActive ? () => this.forceUpdate() : undefined}
                                      activate={() => {
                                   this.activeTab.activateSession(session);
                                   this.setState({ sessions: this.activeTab.sessions });
                              }}>
                    </SessionComponent>
                );

                return [sessionComponent];
            }
        ));

        return (
            <div style={css.application} onKeyDownCapture={this.handleKeyDown.bind(this)}>
                <ul style={css.titleBar}>{tabs}</ul>
                <div style={css.sessions(this.activeTab.sessions.length)}>{sessions}</div>
                <StatusBarComponent presentWorkingDirectory={this.activeTab.activeSession().directory}/>
            </div>
        );
    }

    createCloseTabHandler(index: number) {
        return (event: KeyboardEvent) => {
            this.closeTab(this.tabs[index]);
            this.forceUpdate();
            event.stopPropagation();
            event.preventDefault();
        };
    }

    closeSession(sessionToClose: Session) {
        for (const tab of this.tabs) {
            for (const session of tab.sessions) {
                if (session === sessionToClose) {
                    tab.closeSession(session);

                    if (tab.sessions.length === 0) {
                        this.closeTab(tab);
                    }

                    this.forceUpdate();
                    return;
                }
            }
        }

        throw "Couldn't find the session you asked me to remove.";
    }

    private recalculateDimensions() {
        for (const tab of this.tabs) {
            tab.updateAllSessionsDimensions();
        }
    }

    private get activeTab(): Tab {
        return this.tabs[this.activeTabIndex];
    }

    private addTab(): void {
        this.tabs.push(new Tab(this));
        this.activeTabIndex = this.tabs.length - 1;
    }

    private closeAllTabs(): void {
        // Can't use forEach here because closeTab changes the array being iterated.
        while (this.tabs.length) {
            this.closeTab(this.tabs[0], false);
        }
    }

    private closeTab(tab: Tab, quit = true): void {
        // Can't use forEach here because closeSession changes the array being iterated.
        while (tab.sessions.length) {
            tab.closeSession(tab.sessions[0]);
        }
        _.pull(this.tabs, tab);

        if (this.tabs.length === 0 && quit) {
            ipcRenderer.send("quit");
        } else if (this.tabs.length === this.activeTabIndex) {
            this.activeTabIndex -= 1;
        }
    }
}
