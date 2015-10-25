import * as React from 'react';
import Terminal from '../Terminal';
import Invocation from '../Invocation';
import {VcsData} from '../Interfaces';
import StatusLine from './StatusLine';
import InvocationComponent from './Invocation';

interface Props {
    terminal: Terminal;
}

interface State {
    vcsData?: VcsData;
    invocations?: Invocation[];
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
    handleKeyDown(event: React.KeyboardEvent) {
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
                React.createElement(InvocationComponent, { key: invocation.id, invocation: invocation }, [])
        );

        return React.createElement( 'div', { className: 'terminal', onKeyDown: this.handleKeyDown.bind(this) },
            React.createElement( 'div', { className: 'invocations' }, invocations ),
            React.createElement(StatusLine, { currentWorkingDirectory: this.props.terminal.currentDirectory, vcsData: this.state.vcsData })
        );
    }
}
