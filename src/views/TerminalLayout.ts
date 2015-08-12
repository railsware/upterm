import Terminal = require('../Terminal');
const TerminalComponent = require('../../views/terminal');
import React = require('react');
const main = require('../../views/main');
const letter = document.getElementById('sizes-calculation');

interface State {
    terminals: Terminal[];
}

export class TerminalLayout extends React.Component<{}, State> {
    constructor(props) {
        super(props);

        this.state = {terminals: [this.createTerminal()]};
    }

    createTerminal() {
        let terminal = new Terminal(this.getWindowDimensions());

        $(window).resize(() => terminal.resize(this.getWindowDimensions()));

        return terminal
    }

    handleKeyDown(event: React.KeyboardEvent) {
        // Cmd+_.
        if (event.metaKey && event.keyCode === 189) {
            console.log('Split horizontally.');

            this.setState({
                terminals: this.state.terminals.concat(this.createTerminal())
            });

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
            (terminal, index) => React.createElement(TerminalComponent, {"terminal": terminal, "key": index})
        );

        return React.createElement("div", {className: "terminal-layout", onKeyDown: this.handleKeyDown}, terminals)
    }

    private getWindowDimensions() {
        return {
            columns: Math.floor(window.innerWidth / (letter.clientWidth + 0.5)),
            rows: Math.floor(window.innerHeight / letter.clientHeight)
        };
    }
}
