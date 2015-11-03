import Application from '../Application';
import TerminalComponent from './TerminalComponent';
import * as React from 'react';
import * as i from '../Interfaces';
import Terminal from "../Terminal";

interface State {
    terminals: Terminal[];
}

export default class ApplicationComponent extends React.Component<{}, State> {
    private application: Application;

    constructor(props: {}) {
        super(props);

        this.application = new Application(this.charSize, this.contentSize);
        this.state = {terminals: this.application.terminals};

        $(window).resize(() => this.application.contentSize = this.contentSize);

        require('ipc').on('change-working-directory', (directory: string) =>
            this.application.activeTerminal.currentDirectory = directory
        );
    }

    handleKeyDown(event: React.KeyboardEvent) {
        // Cmd+_.
        if (event.metaKey && event.keyCode === 189) {
            console.log('Split horizontally.');

            this.application.addTerminal();
            this.setState({terminals: this.application.terminals});
            event.stopPropagation();
            event.preventDefault();
        }

        // Cmd+|.
        if (event.metaKey && event.keyCode === 220) {
            console.log('Split vertically.');

            event.stopPropagation();
            event.preventDefault();
        }
    }

    render() {
        let terminals = this.state.terminals.map(
            (terminal, index) => React.createElement(TerminalComponent, {
                terminal: terminal,
                key: index,
                active: terminal === this.application.activeTerminal,
                activateTerminal: (terminal: Terminal) => {
                    this.application.activateTerminal(terminal);
                    this.forceUpdate();
                }
            })
        );

        return React.createElement("div", {
            className: "application",
            onKeyDown: this.handleKeyDown.bind(this)
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
