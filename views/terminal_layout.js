import React from 'react';
import Terminal from '../Terminal';
import TerminalComponent from './terminal';

export default React.createClass({
    getInitialState() {
        let terminal = new Terminal(getDimensions());
        $(window).resize(() => terminal.resize(getDimensions()));

        return {terminals: [terminal]};
    },
    handleKeyDown(event) {
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
    },
    render() {
        let terminals = this.state.terminals.map((terminal, index) =>
            <TerminalComponent terminal={terminal} key={index}/>
        );

        return (
            <div className="terminal-layout" onKeyDown={this.handleKeyDown}>
                {terminals}
            </div>
        );
    }
});
