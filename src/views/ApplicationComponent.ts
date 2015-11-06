import Application from '../Application';
import TerminalComponent from './TerminalComponent';
import * as React from 'react';
import * as i from '../Interfaces';
import * as _ from 'lodash';
import Terminal from "../Terminal";
const IPC = require('ipc');

interface State {
    terminals: Terminal[];
}

export default class ApplicationComponent extends React.Component<{}, State> {
    private application: Application;

    constructor(props: {}) {
        super(props);

        this.application = Application.getInstance();
        this.application.charSize = this.charSize;
        this.application.contentSize = this.contentSize;
        this.application.addTerminal();
        this.application.activateTerminal(this.application.terminals[0]);

        this.state = { terminals: this.application.terminals };

        $(window).resize(() => this.application.contentSize = this.contentSize);
        IPC.on('change-working-directory', (directory: string) =>
            this.application.activeTerminal.currentDirectory = directory
        );
    }

    handleKeyDown(event: JQueryKeyEventObject) {
        // Cmd+_.
        if (event.metaKey && event.keyCode === 189) {
            this.application.activateTerminal(this.application.addTerminal());
            this.setState({ terminals: this.application.terminals });

            event.stopPropagation();
        }

        // Cmd+|.
        if (event.metaKey && event.keyCode === 220) {
            console.log('Split vertically.');

            event.stopPropagation();
        }

        // Ctrl+D.
        if (event.ctrlKey && event.keyCode === 68) {
            this.application
                .removeTerminal(this.application.activeTerminal)
                .activateTerminal(_.last(this.application.terminals));

            this.setState({ terminals: this.application.terminals });

            event.stopPropagation();
        }
    }

    render() {
        let terminals = this.state.terminals.map(
            (terminal, index) => React.createElement(TerminalComponent, {
                terminal: terminal,
                key: index,
                isActive: terminal === this.application.activeTerminal,
                activateTerminal: (terminal: Terminal) => {
                    this.application.activateTerminal(terminal);
                    this.forceUpdate();
                }
            })
        );

        return React.createElement("div", {
            className: "application",
            onKeyDownCapture: this.handleKeyDown.bind(this)
        }, terminals)
    }

    private get contentSize(): i.Size {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
        }
    }

    private get charSize(): i.Size {
        var letter = document.getElementById('sizes-calculation');

        return {
            width: letter.clientWidth + 0.5,
            height: letter.clientHeight,
        };
    };
}
