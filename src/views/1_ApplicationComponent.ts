import TerminalComponent from "./2_TerminalComponent";
import {TabComponent, TabProps, Tab} from "./TabComponent";
import * as React from "react";
import * as _ from "lodash";
import Terminal from "../Terminal";
const IPC = require("ipc");
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
        this.state = { terminals: this.activeTab.terminals };

        $(window).resize(() => {
            for (const tab of this.tabs) {
                tab.updateAllTerminalsDimensions();
            }
        });

        IPC.on("change-working-directory", (directory: string) =>
            this.activeTab.activeTerminal().currentDirectory = directory
        );
    }

    handleKeyDown(event: JQueryKeyEventObject) {
        // Cmd+_.
        if (event.metaKey && event.keyCode === 189) {
            this.activeTab.addTerminal();
            this.setState({ terminals: this.activeTab.terminals });

            event.stopPropagation();
        }

        // Cmd+|.
        if (event.metaKey && event.keyCode === 220) {
            console.log("Split vertically.");

            event.stopPropagation();
        }

        // Ctrl+D.
        if (event.ctrlKey && event.keyCode === 68) {
            this.removeActiveTerminal();

            this.setState({ terminals: this.activeTab.terminals });

            event.stopPropagation();
        }

        // Cmd+J.
        if (event.metaKey && event.keyCode === 74) {
            if (this.activeTab.activateNextTerminal()) {
                this.setState({ terminals: this.activeTab.terminals });

                event.stopPropagation();
            }
        }

        // Cmd+K.
        if (event.metaKey && event.keyCode === 75) {
            if (this.activeTab.activatePreviousTerminal()) {
                this.setState({ terminals: this.activeTab.terminals });

                event.stopPropagation();
            }
        }

        // Cmd+T.
        if (event.metaKey && event.keyCode === 84) {
            if (this.tabs.length < 9) {
                this.createTab();
                this.setState({ terminals: this.activeTab.terminals });
            } else {
                shell.beep();
            }

            event.stopPropagation();
        }

        // Cmd+W.
        if (event.metaKey && event.keyCode === 87) {
            this.removeActiveTab();
            this.setState({ terminals: this.activeTab.terminals });

            event.stopPropagation();
            event.preventDefault();
        }

        // Cmd+[1-9].
        if (event.metaKey && event.keyCode >= 49 && event.keyCode <= 57) {
            const newTabIndex = parseInt(event.key, 10) - 1;

            if (this.tabs.length > newTabIndex) {
                this.activeTabIndex = newTabIndex;
                this.setState({ terminals: this.activeTab.terminals });
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
                React.createElement(
                    TabComponent,
                    {
                        isActive: index === this.activeTabIndex,
                        position: index + 1,
                        key: index,
                        activate: () => {
                            this.activeTabIndex = index;
                            this.setState({ terminals: this.activeTab.terminals });
                        },
                    })
            );
        }

        let terminals = this.state.terminals.map(
            terminal => React.createElement(TerminalComponent, {
                terminal: terminal,
                key: terminal.id,
                isActive: terminal === this.activeTab.activeTerminal(),
                activateTerminal: (newActiveTerminal: Terminal) => {
                    this.activeTab.activateTerminal(newActiveTerminal);
                    this.setState({ terminals: this.activeTab.terminals });
                },
            })
        );

        return React.createElement(
            "div",
            {
                className: "application",
                onKeyDownCapture: this.handleKeyDown.bind(this),
            },
            React.createElement("ul", { className: "tabs" }, tabs),
            React.createElement("div", { className: "active-tab-content" }, terminals)
        );
    }

    private get activeTab(): Tab {
        return this.tabs[this.activeTabIndex];
    }

    private createTab(): void {
        this.tabs.push(new Tab());
        this.activeTabIndex = this.tabs.length - 1;
    }

    private removeActiveTerminal(): void {
        this.activeTab.removeActiveTerminal();

        if (this.activeTab.terminals.length === 0) {
            this.removeActiveTab();
        }
    }

    private removeActiveTab(): void {
        _.pullAt(this.tabs, this.activeTabIndex);

        if (this.tabs.length === 0) {
            IPC.send("quit");
        } else if (this.tabs.length === this.activeTabIndex) {
            this.activeTabIndex -= 1;
        }
    }
}
