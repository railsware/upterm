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
    private terminals: Terminal[] = [];
    private activeTerminalIndex: number;

    constructor(props: {}) {
        super(props);

        this.addTerminal();
        this.activateTerminal(this.terminals[0]);
        this.state = { terminals: this.terminals };

        this.terminals.forEach((terminal: Terminal) => terminal.dimensions = this.contentDimensions);
        $(window).resize(() => this.terminals.forEach((terminal: Terminal) => terminal.dimensions = this.contentDimensions));

        IPC.on("change-working-directory", (directory: string) =>
            this.activeTerminal.currentDirectory = directory
        );
    }

    handleKeyDown(event: JQueryKeyEventObject) {
        // Cmd+_.
        if (event.metaKey && event.keyCode === 189) {
            this.activateTerminal(this.addTerminal());
            this.setState({ terminals: this.terminals });

            event.stopPropagation();
        }

        // Cmd+|.
        if (event.metaKey && event.keyCode === 220) {
            console.log("Split vertically.");

            event.stopPropagation();
        }

        // Ctrl+D.
        if (event.ctrlKey && event.keyCode === 68) {
            this.removeTerminal(this.activeTerminal).activateTerminal(_.last(this.terminals));
            this.setState({ terminals: this.terminals });

            event.stopPropagation();
        }

        // Cmd+J.
        if (event.metaKey && event.keyCode === 74) {
            if (this.activeTerminalIndex !== this.terminals.length - 1) {
                this.activateTerminal(this.terminals[this.activeTerminalIndex + 1]);
                this.setState({ terminals: this.terminals });

                event.stopPropagation();
            }
        }

        // Cmd+K.
        if (event.metaKey && event.keyCode === 75) {
            if (this.activeTerminalIndex) {
                this.activateTerminal(this.terminals[this.activeTerminalIndex - 1]);
                this.setState({ terminals: this.terminals });

                event.stopPropagation();
            }
        }
    }

    render() {
        let terminals = this.state.terminals.map(
            terminal => React.createElement(TerminalComponent, {
                terminal: terminal,
                key: terminal.id,
                isActive: terminal === this.activeTerminal,
                activateTerminal: (newActiveTerminal: Terminal) => {
                    this.activateTerminal(newActiveTerminal);
                    this.setState({ terminals: this.terminals })
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

    private addTerminal(): Terminal {
        let terminal = new Terminal(this.contentDimensions);
        this.terminals.push(terminal);

        return terminal;
    }

    private removeTerminal(terminal: Terminal): ApplicationComponent {
        _.pull(this.terminals, terminal);

        if (_.isEmpty(this.terminals)) {
            IPC.send("quit");
        }

        return this;
    }

    private activateTerminal(terminal: Terminal): void {
        this.activeTerminalIndex = this.terminals.indexOf(terminal);
    }

    private get activeTerminal(): Terminal {
        return this.terminals[this.activeTerminalIndex];
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
