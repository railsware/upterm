import Application from "../Application";
import TerminalComponent from "./2_TerminalComponent";
import TabComponent from "./TabComponent";
import * as React from "react";
import * as _ from "lodash";
import Terminal from "../Terminal";
const IPC = require("ipc");

interface State {
    terminals: Terminal[];
}

export default class ApplicationComponent extends React.Component<{}, State> {
    private application: Application;

    constructor(props: {}) {
        super(props);

        this.application = Application.instance;
        this.application.charSize = this.charSize;
        this.application.contentSize = this.contentSize;
        this.application.addTerminal();
        this.application.activateTerminal(this.application.terminals[0]);

        this.state = { terminals: this.application.terminals };
        this.application.on("terminal", () => this.setState({ terminals: this.application.terminals }));

        $(window).resize(() => this.application.contentSize = this.contentSize);
        IPC.on("change-working-directory", (directory: string) =>
            this.application.activeTerminal.currentDirectory = directory
        );
    }

    handleKeyDown(event: JQueryKeyEventObject) {
        // Cmd+_.
        if (event.metaKey && event.keyCode === 189) {
            this.application.activateTerminal(this.application.addTerminal());

            event.stopPropagation();
        }

        // Cmd+|.
        if (event.metaKey && event.keyCode === 220) {
            console.log("Split vertically.");

            event.stopPropagation();
        }

        // Ctrl+D.
        if (event.ctrlKey && event.keyCode === 68) {
            this.application
                .removeTerminal(this.application.activeTerminal)
                .activateTerminal(_.last(this.application.terminals));

            event.stopPropagation();
        }

        // Cmd+J.
        if (event.metaKey && event.keyCode === 74) {
            let activeTerminalIndex = this.application.terminals.indexOf(this.application.activeTerminal);
            if (activeTerminalIndex !== this.application.terminals.length - 1) {
                this.application.activateTerminal(this.application.terminals[activeTerminalIndex + 1]);
                this.setState({ terminals: this.application.terminals });

                event.stopPropagation();
            }
        }

        // Cmd+K.
        if (event.metaKey && event.keyCode === 75) {
            let activeTerminalIndex = this.application.terminals.indexOf(this.application.activeTerminal);
            if (activeTerminalIndex) {
                this.application.activateTerminal(this.application.terminals[activeTerminalIndex - 1]);
                this.setState({ terminals: this.application.terminals });

                event.stopPropagation();
            }
        }
    }

    render() {
        let terminals = this.state.terminals.map(
            terminal => React.createElement(TerminalComponent, {
                terminal: terminal,
                key: terminal.id,
                isActive: terminal === this.application.activeTerminal,
                activateTerminal: (newActiveTerminal: Terminal) => {
                    this.application.activateTerminal(newActiveTerminal);
                    this.forceUpdate();
                },
            })
        );

        let tabs = [
            React.createElement(TabComponent, { isActive: false, position: 1, key: 1 }),
            React.createElement(TabComponent, { isActive: true, position: 2, key: 2 }),
            React.createElement(TabComponent, { isActive: false, position: 3, key: 3 }),
            React.createElement(TabComponent, { isActive: false, position: 4, key: 4 }),
        ];

        return React.createElement(
            "div",
            {
                className: "application",
                onKeyDownCapture: this.handleKeyDown.bind(this),
            },
            React.createElement( "ul", { className: "tabs" }, tabs),
            React.createElement( "div", { className: "active-tab-content" }, terminals)
        );
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
