import Application from '../Application';
import TerminalComponent from './TerminalComponent';
import * as React from 'react';
import * as i from '../Interfaces';
var remote = require('remote');

interface State {
    application: Application;
}

export default class ApplicationView extends React.Component<{}, State> {
    private browserWindow = remote.getCurrentWindow();

    constructor(props) {
        super(props);
        this.restoreState();

        this.state = {application: new Application(this.charSize, this.contentSize)};
        this.subscribeToEvents();
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

    private restoreState() {
        var contentSize = JSON.parse(localStorage.getItem('content-size'));
        if (contentSize) {
            this.browserWindow.setContentSize(contentSize.width, contentSize.height);
        }

        var windowPosition = JSON.parse(localStorage.getItem('window-position'));
        if (windowPosition) {
            this.browserWindow.setPosition(...windowPosition);
        }
    };

    private subscribeToEvents() {
        this.browserWindow.on('move', () => {
            localStorage.setItem('window-position', JSON.stringify(this.browserWindow.getPosition()));
        });

        $(window).resize(() => {
            localStorage.setItem('content-size', JSON.stringify(this.contentSize));
            this.state.application.contentSize = this.contentSize;
        })
    };
}
