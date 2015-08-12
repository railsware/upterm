import React = require('react');
const Invocation = require('../../views/invocation');
const StatusLine = require('../../views/status_line');

interface Props {
    terminal: any;
}

interface State {
    vcsData?: any;
    invocations?: any[];
}

export default class TerminalComponent extends React.Component<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            vcsData: {isRepository: false},
            invocations: this.props.terminal.invocations
        }
    }
    componentWillMount() {
        this.props.terminal
            .on('invocation', _ => this.setState({invocations: this.props.terminal.invocations}))
            .on('vcs-data', data => this.setState({vcsData: data}));
    }
    handleKeyDown(event) {
        // Ctrl+L.
        if (event.ctrlKey && event.keyCode === 76) {
            this.props.terminal.clearInvocations();

            event.stopPropagation();
            event.preventDefault();
        }

        // Cmd+D.
        if (event.metaKey && event.keyCode === 68) {
            (<any>window).DEBUG = !(<any>window).DEBUG;

            event.stopPropagation();
            event.preventDefault();
            this.forceUpdate();
            console.log(`Debugging mode has been ${(<any>window).DEBUG ? 'enabled' : 'disabled'}.`);
        }
    }
    render() {
        var invocations = this.state.invocations.map(invocation =>
                React.createElement(Invocation, { key: invocation.id, invocation: invocation }, [])
        );

        return React.createElement( 'div', { className: 'terminal', onKeyDown: this.handleKeyDown },
            React.createElement( 'div', { className: 'invocations' }, invocations ),
            React.createElement(StatusLine, { currentWorkingDirectory: this.props.terminal.currentDirectory, vcsData: this.state.vcsData })
        );
    }
}
