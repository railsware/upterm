import * as React from 'react';
import * as _ from 'lodash';
import Terminal from '../Terminal';
import Invocation from '../Invocation';
import {VcsData} from '../Interfaces';
import StatusLineComponent from './StatusLineComponent';
import InvocationComponent from './InvocationComponent';
import DOMElement = __React.DOMElement;

interface Props {
    terminal: Terminal;
    isActive: boolean;
    activateTerminal: (t: Terminal) => void;
}

interface State {
    vcsData?: VcsData;
    invocations?: Invocation[];
}

export default class TerminalComponent extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            vcsData: { isRepository: false },
            invocations: this.props.terminal.invocations
        }
    }

    componentWillMount() {
        this.props.terminal
            .on('invocation', () => this.setState({ invocations: this.props.terminal.invocations }))
            .on('vcs-data', (data: VcsData) => this.setState({ vcsData: data }));
    }

    render() {
        var invocations = this.state.invocations.map((invocation: Invocation, index: number) =>
            React.createElement(InvocationComponent, {
                key: invocation.id,
                invocation: invocation,
                hasLocusOfAttention: this.props.isActive && index === this.state.invocations.length - 1
            }, [])
        );

        let activenessClass = this.props.isActive ? 'active' : 'inactive';

        return React.createElement('div', {
                className: `terminal ${activenessClass}`,
                tabIndex: 0,
                onClickCapture: this.handleClick.bind(this),
                onKeyDownCapture: this.handleKeyDown.bind(this)
            },
            React.createElement('div', { className: 'invocations' }, invocations),
            React.createElement(StatusLineComponent, {
                currentWorkingDirectory: this.props.terminal.currentDirectory,
                vcsData: this.state.vcsData
            })
        );
    }

    private handleClick() {
        if (!this.props.isActive) {
            this.props.activateTerminal(this.props.terminal);
        }
    }

    private handleKeyDown(event: KeyboardEvent) {
        if (!_.contains(document.activeElement.classList, 'prompt')) {
            this.focusLastPrompt(<HTMLDivElement>event.target);
        }

        // Ctrl+L.
        if (event.ctrlKey && event.keyCode === 76) {
            this.props.terminal.clearInvocations();

            event.stopPropagation();
        }

        // Cmd+D.
        if (event.metaKey && event.keyCode === 68) {
            window.DEBUG = !window.DEBUG;

            event.stopPropagation();
            this.forceUpdate();

            console.log(`Debugging mode has been ${window.DEBUG ? 'enabled' : 'disabled'}.`);
        }
    }

    private focusLastPrompt(terminalNode: HTMLDivElement): void {
        _.last(terminalNode.getElementsByClassName('prompt')).focus();
    }
}
