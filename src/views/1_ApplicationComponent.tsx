import SessionComponent from "./2_SessionComponent";
import {TabComponent, TabProps, Tab} from "./TabComponent";
import * as React from "react";
import * as _ from "lodash";
import Session from "../Session";
import {ipcRenderer} from "electron";
import {CharCode} from "../Enums";
const shell: Electron.Shell = require("remote").require("electron").shell;

interface State {
    sessions: Session[];
}

export default class ApplicationComponent extends React.Component<{}, State> {
    private tabs: Tab[] = [];
    private activeTabIndex: number;

    constructor(props: {}) {
        super(props);

        this.createTab();
        this.state = {sessions: this.activeTab.sessions};

        $(window).resize(() => {
            for (const tab of this.tabs) {
                tab.updateAllSessionsDimensions();
            }
        });

        ipcRenderer.on("change-working-directory", (event: Event, directory: string) =>
            this.activeTab.activeSession().currentDirectory = directory
        );
    }

    handleKeyDown(event: JQueryKeyEventObject) {
        if (event.metaKey && event.keyCode === CharCode.Underscore) {
            this.activeTab.addSession();
            this.setState({sessions: this.activeTab.sessions});

            event.stopPropagation();
        }

        if (event.metaKey && event.keyCode === CharCode.VerticalBar) {
            console.log("Split vertically.");

            event.stopPropagation();
        }

        if (event.ctrlKey && event.keyCode === CharCode.D) {
            this.removeSession(this.activeTab.activeSession());

            this.setState({sessions: this.activeTab.sessions});

            event.stopPropagation();
        }

        if (event.metaKey && event.keyCode === CharCode.J) {
            if (this.activeTab.activateNextSession()) {
                this.setState({sessions: this.activeTab.sessions});

                event.stopPropagation();
            }
        }

        if (event.metaKey && event.keyCode === CharCode.K) {
            if (this.activeTab.activatePreviousSession()) {
                this.setState({sessions: this.activeTab.sessions});

                event.stopPropagation();
            }
        }

        if (event.metaKey && event.keyCode === CharCode.T) {
            if (this.tabs.length < 9) {
                this.createTab();
                this.setState({sessions: this.activeTab.sessions});
            } else {
                shell.beep();
            }

            event.stopPropagation();
        }

        if (event.metaKey && event.keyCode === CharCode.W) {
            this.removeTab(this.activeTab);
            this.setState({sessions: this.activeTab.sessions});

            event.stopPropagation();
            event.preventDefault();
        }

        if (event.metaKey && event.keyCode >= CharCode.One && event.keyCode <= CharCode.Nine) {
            const newTabIndex = parseInt(event.key, 10) - 1;

            if (this.tabs.length > newTabIndex) {
                this.activeTabIndex = newTabIndex;
                this.setState({sessions: this.activeTab.sessions});
            } else {
                shell.beep();
            }

            event.stopPropagation();
        }
    }

    render() {
        let tabs: React.ReactElement<TabProps>[];

        if (this.tabs.length > 1) {
            tabs = this.tabs.map((tab: Tab, index: number) =>
                <TabComponent isActive={index === this.activeTabIndex}
                              key={index}
                              position={index + 1}
                              activate={() => {
                                this.activeTabIndex = index;
                                this.setState({ sessions: this.activeTab.sessions });
                              }}>
                </TabComponent>
            );
        }

        let sessions = this.state.sessions.map(session =>
            <SessionComponent session={session}
                               key={session.id}
                               isActive={session === this.activeTab.activeSession()}
                               activate={() => {
                                   this.activeTab.activateSession(session);
                                   this.setState({ sessions: this.activeTab.sessions });
                               }}>
            </SessionComponent>
        );

        return (
            <div className="application" onKeyDownCapture={this.handleKeyDown.bind(this)}>
                <ul className="tabs">{tabs}</ul>
                <div className="active-tab-content">{sessions}</div>
            </div>
        );
    }

    public removeSession(sessionToRemove: Session) {
        for (const tab of this.tabs) {
            for (const session of tab.sessions) {
                if (session === sessionToRemove) {
                    tab.removeSession(session);

                    if (tab.sessions.length === 0) {
                        this.removeTab(tab);
                    }

                    this.setState({sessions: this.activeTab.sessions});

                    return;
                }
            }
        }

        throw "Couldn't find the session you asked me to remove.";
    }

    private get activeTab(): Tab {
        return this.tabs[this.activeTabIndex];
    }

    private createTab(): void {
        this.tabs.push(new Tab(this));
        this.activeTabIndex = this.tabs.length - 1;
    }

    private removeTab(tab: Tab): void {
        _.pull(this.tabs, tab);

        if (this.tabs.length === 0) {
            ipcRenderer.send("quit");
        } else if (this.tabs.length === this.activeTabIndex) {
            this.activeTabIndex -= 1;
        }
    }
}
