import React from 'react';

var Board = React.createClass({
    componentDidMount() {
        this.props.terminal.on('invocation', this.forceUpdate.bind(this));
    },
    handleKeyDown(event) {
        // Ctrl+l
        if (event.ctrlKey && event.keyCode === 76) {
            this.props.terminal.clearInvocations();

            event.stopPropagation();
            event.preventDefault();
        }
    },
    render() {
        var invocations = this.props.terminal.invocations.map((invocation) => {
            return (
                <Invocation key={invocation.id} invocation={invocation}/>
            )
        });

        return (
            <div id="board" onKeyDown={this.handleKeyDown}>
                <div id="invocations">
                    {invocations}
                </div>
                <StatusLine currentWorkingDirectory={this.props.terminal.currentDirectory}/>
            </div>
        );
    }
});

export { Board };
