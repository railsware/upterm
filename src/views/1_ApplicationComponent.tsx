import {SessionComponent} from "./2_SessionComponent";
import {TabComponent, TabProps, Tab} from "./TabComponent";
import * as React from "react";
import * as _ from "lodash";
import {Session} from "../shell/Session";
import {ipcRenderer} from "electron";
import {KeyCode, Status, SplitDirection} from "../Enums";
import {remote} from "electron";
import * as css from "./css/main";
import {saveWindowBounds} from "./ViewUtils";
import {StatusBarComponent} from "./StatusBarComponent";
import {PaneTree, Pane} from "../utils/PaneTree";

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
            this.activeTab.activeSession.directory = directory
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
            this.activeTab.addPane(SplitDirection.Horizontal);
            this.forceUpdate();
            event.stopPropagation();
        }

        if (event.metaKey && event.keyCode === KeyCode.VerticalBar) {
            this.activeTab.addPane(SplitDirection.Vertical);
            this.forceUpdate();
            event.stopPropagation();
        }

        if (event.ctrlKey && event.keyCode === KeyCode.D) {
            const activeSession = this.activeTab.activeSession;

            if (activeSession.currentJob.status !== Status.InProgress) {
                this.closePane(activeSession);

                this.forceUpdate();
                event.stopPropagation();
            }
        }

        if (event.metaKey && event.keyCode === KeyCode.W) {
            this.closePane(this.activeTab.activeSession);

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

    // FIXME: this method should be private.
    closePane(sessionToClose: Session) {
        this.activeTab.closePane(sessionToClose);

        if (this.activeTab.panesCount === 0) {
            this.closeTab(this.activeTab);
        }

        this.forceUpdate();
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
                                this.forceUpdate();
                              }}
                              closeHandler={(event: KeyboardEvent) => {
                                  this.closeTab(this.tabs[index]);
                                  this.forceUpdate();

                                  event.stopPropagation();
                                  event.preventDefault();
                              }}>
                </TabComponent>
            );
        }

        return (
            <div style={css.application} onKeyDownCapture={this.handleKeyDown.bind(this)}>
                <ul style={css.titleBar}>{tabs}</ul>
                {this.renderPanes(this.activeTab.panes)}
                <StatusBarComponent presentWorkingDirectory={this.activeTab.activeSession.directory}/>
            </div>
        );
    }

    private renderPanes(tree: PaneTree): JSX.Element {
        if (tree instanceof Pane) {
            const pane = tree;
            const session = pane.session;
            const isActive = pane === this.activeTab.activePane;

            return (
                <SessionComponent session={session}
                                  key={session.id}
                                  isActive={isActive}
                                  updateStatusBar={isActive ? () => this.forceUpdate() : undefined}
                                  activate={() => {
                                      this.activeTab.activatePane(pane);
                                      this.forceUpdate();
                                  }}>
                </SessionComponent>
            );
        } else {
            return <div style={css.sessions(tree)}>{tree.children.map(child => this.renderPanes(child))}</div>;
        }
    }

    private recalculateDimensions() {
        for (const tab of this.tabs) {
            tab.updateAllSessionsDimensions();
        }
    }

    private addTab(): void {
        this.tabs.push(new Tab(this));
        this.activeTabIndex = this.tabs.length - 1;
    }

    private get activeTab(): Tab {
        return this.tabs[this.activeTabIndex];
    }

    private closeTab(tab: Tab, quit = true): void {
        tab.closeAllPanes();
        _.pull(this.tabs, tab);

        if (this.tabs.length === 0 && quit) {
            ipcRenderer.send("quit");
        } else if (this.tabs.length === this.activeTabIndex) {
            this.activeTabIndex -= 1;
        }
    }

    private closeAllTabs(): void {
        // Can't use forEach here because closeTab changes the array being iterated.
        while (this.tabs.length) {
            this.closeTab(this.tabs[0], false);
        }
    }
}
