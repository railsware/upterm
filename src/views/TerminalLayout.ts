import Terminal = require('../Terminal');
import TerminalComponent from './TerminalComponent';
import React = require('react');

var remote = require('remote');
var currentWindow = remote.getCurrentWindow();

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
        let restore = false;

        return React.createElement("div", null,
            React.createElement("div", {className: "terminal-header"}, 
                React.createElement("div", {className: "actions-wrapper"}, 
                    React.createElement("ul", {className: "actions-list"}, 
                        React.createElement("li", { className: "actions-item" }, React.createElement("div", { className: "img min", onClick: () => currentWindow.minimize() })), 
                        React.createElement("li", { className: "actions-item" }, React.createElement("div", { className: "img max", onClick: () => {
                            currentWindow[restore ? 'restore' : 'maximize']();

                            restore = !restore;
                        } })), 
                        React.createElement("li", {className: "actions-item"}, React.createElement("div", {className: "img close", onClick: () => remote.require('app').quit() }))
                    )
                )
            ), 
            React.createElement("div", { className: "terminal-layout", onKeyDown: this.handleKeyDown.bind(this) }, terminals)
        );
    }

    private getWindowDimensions() {
        var letter = document.getElementById('sizes-calculation');

        return {
            columns: Math.floor(window.innerWidth / (letter.clientWidth + 0.5)),
            rows: Math.floor(window.innerHeight / letter.clientHeight)
        };
    }

}
