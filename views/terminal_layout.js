import React from 'react/addons';
import Terminal from '../src/Terminal';
import TerminalComponent from './terminal';

export default React.createClass({
    getInitialState() {
        return {terminals: [this.createTerminal()]};
    },
    createTerminal() {
        let terminal = new Terminal(getDimensions());
        $(window).resize(() => terminal.resize(getDimensions()));

        return terminal
    },
    handleKeyDown(event) {
        // Cmd+_.
        if (event.metaKey && event.keyCode === 189) {
            console.log('Split horizontally.');
            let terminal = new Terminal(getDimensions());
            $(window).resize(() => terminal.resize(getDimensions()));

            this.setState({
                terminals: React.addons.update(this.state.terminals, {$push: [this.createTerminal()]})
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
