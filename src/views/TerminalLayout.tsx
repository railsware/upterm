/// <reference path="../../dts/typings/react/react.d.ts" />

import Terminal = require('../Terminal');
var TerminalComponent = require('../../views/terminal');
import React = require('react');
var main = require('../../views/main');

interface State {
    terminals: Terminal[];
}

function getDimensions() {
    var letter = document.getElementById('sizes-calculation');
    return {
        columns: Math.floor(window.innerWidth / (letter.clientWidth + 0.5)),
        rows:    Math.floor(window.innerHeight / letter.clientHeight)
    };
}

export class TerminalLayout extends React.Component<{}, State> {
    constructor(props) {
        super(props);
        this.state =  {terminals: [this.createTerminal()]};
    }
    createTerminal() {
        let terminal = new Terminal(getDimensions());
        $(window).resize(() => terminal.resize(getDimensions()));

        return terminal
    }
    handleKeyDown(event: React.KeyboardEvent) {
        // Cmd+_.
        if (event.metaKey && event.keyCode === 189) {
            console.log('Split horizontally.');
            let terminal = new Terminal(getDimensions());
            $(window).resize(() => terminal.resize(getDimensions()));

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
        let terminals = this.state.terminals.map((terminal, index) =>
            <TerminalComponent terminal={terminal} key={index}/>
        )

        return (
            <div className="terminal-layout" onKeyDown={this.handleKeyDown}>
                {terminals}
            </div>
        )
    }
}
