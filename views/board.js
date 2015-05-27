import React from 'react';
import Invocation from './invocation';
import StatusLine from './status_line';

export default React.createClass({
    getInitialState() {
        return {vcsData: {
            isRepository: true,
            branch: 'name',
            status: 'clean'
        }};
    },
    componentWillMount() {
        this.props.terminal
            .on('invocation', this.forceUpdate.bind(this))
            .on('vcs-data', (data) => { this.setState({vcsData: data}) });
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
                <StatusLine currentWorkingDirectory={this.props.terminal.currentDirectory}
                            vcsData={this.state.vcsData}/>
            </div>
        );
    }
});
