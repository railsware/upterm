import TerminalComponent from "./2_TerminalComponent";
import {TabComponent, TabProps, Tab} from "./TabComponent";
import * as React from "react";
import * as _ from "lodash";
import Terminal from "../Terminal";
import {ipcRenderer} from "electron";
import {CharCode} from "../Enums";
const shell: Electron.Shell = require("remote").require("electron").shell;

interface State {
    terminals: Terminal[];
}

export default class ApplicationComponent extends React.Component<{}, State> {
    private tabs: Tab[] = [];
    private activeTabIndex: number;

    constructor(props: {}) {
        super(props);

        this.createTab();
        this.state = {terminals: this.activeTab.terminals};

        $(window).resize(() => {
            for (const tab of this.tabs) {
                tab.updateAllTerminalsDimensions();
            }
        });

        ipcRenderer.on("change-working-directory", (directory: string) =>
            this.activeTab.activeTerminal().currentDirectory = directory
        );
    }

    handleKeyDown(event: JQueryKeyEventObject) {
        if (event.metaKey && event.keyCode === CharCode.Underscore) {
            this.activeTab.addTerminal();
            this.setState({terminals: this.activeTab.terminals});

            event.stopPropagation();
        }

        if (event.metaKey && event.keyCode === CharCode.VerticalBar) {
            console.log("Split vertically.");

            event.stopPropagation();
        }

        if (event.ctrlKey && event.keyCode === CharCode.D) {
            this.removeTerminal(this.activeTab.activeTerminal());

            this.setState({terminals: this.activeTab.terminals});

            event.stopPropagation();
        }

        if (event.metaKey && event.keyCode === CharCode.J) {
            if (this.activeTab.activateNextTerminal()) {
                this.setState({terminals: this.activeTab.terminals});

                event.stopPropagation();
            }
        }

        if (event.metaKey && event.keyCode === CharCode.K) {
            if (this.activeTab.activatePreviousTerminal()) {
                this.setState({terminals: this.activeTab.terminals});

                event.stopPropagation();
            }
        }

        if (event.metaKey && event.keyCode === CharCode.T) {
            if (this.tabs.length < 9) {
                this.createTab();
                this.setState({terminals: this.activeTab.terminals});
            } else {
                shell.beep();
            }

            event.stopPropagation();
        }

        if (event.metaKey && event.keyCode === CharCode.W) {
            this.removeTab(this.activeTab);
            this.setState({terminals: this.activeTab.terminals});

            event.stopPropagation();
            event.preventDefault();
        }

        if (event.metaKey && event.keyCode >= CharCode.One && event.keyCode <= CharCode.Nine) {
            const newTabIndex = parseInt(event.key, 10) - 1;

            if (this.tabs.length > newTabIndex) {
                this.activeTabIndex = newTabIndex;
                this.setState({terminals: this.activeTab.terminals});
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
                                this.setState({ terminals: this.activeTab.terminals });
                              }}>
                </TabComponent>
            );
        }

        let terminals = this.state.terminals.map(terminal =>
            <TerminalComponent terminal={terminal}
                               key={terminal.id}
                               isActive={terminal === this.activeTab.activeTerminal()}
                               activate={() => {
                                   this.activeTab.activateTerminal(terminal);
                                   this.setState({ terminals: this.activeTab.terminals });
                               }}>
            </TerminalComponent>
        );

        return (
            <div className="application" onKeyDownCapture={this.handleKeyDown.bind(this)}>
                <ul className="tabs">{tabs}</ul>
                <div className="active-tab-content">{terminals}</div>
            </div>
        );
    }

    public removeTerminal(terminalToRemove: Terminal) {
        for (const tab of this.tabs) {
            for (const terminal of tab.terminals) {
                if (terminal === terminalToRemove) {
                    tab.removeTerminal(terminal);

                    if (tab.terminals.length === 0) {
                        this.removeTab(tab);
                    }

                    this.setState({terminals: this.activeTab.terminals});

                    return;
                }
            }
        }

        throw "Couldn't find the terminal you asked me to remove.";
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
