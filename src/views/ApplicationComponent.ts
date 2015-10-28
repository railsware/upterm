import Application from '../Application';
import TerminalComponent from './TerminalComponent';
import * as React from 'react';
import * as i from '../Interfaces';

interface State {
    application: Application;
}

export default class ApplicationComponent extends React.Component<{}, State> {
    constructor(props) {
        super(props);

        $(window).resize(() => this.state.application.contentSize = this.contentSize);
        this.state = {application: new Application(this.charSize, this.contentSize)};
        require('ipc').on('change-working-directory', (directory: string) =>
            this.state.application.activeTerminal.currentDirectory = directory
        );
    }

    handleKeyDown(event: React.KeyboardEvent) {
        // Cmd+_.
        if (event.metaKey && event.keyCode === 189) {
            console.log('Split horizontally.');

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
        let terminals = this.state.application.terminals.map(
            (terminal, index) => React.createElement(TerminalComponent, {"terminal": terminal, "key": index})
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
