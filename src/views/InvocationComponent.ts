import * as React from 'react';
import * as e from '../Enums';
import * as _ from 'lodash';
import InvocationModel from '../Invocation';
import {keys} from './ViewUtils';
import PromptComponent from './PromptComponent';
import BufferComponent from "./BufferComponent";

interface Props {
    invocation: InvocationModel;
    hasLocusOfAttention: boolean;
}

interface State {
    status?: e.Status;
    canBeDecorated?: boolean;
    decorate?: boolean;
}

export default class InvocationComponent extends React.Component<Props, State> implements KeyDownReceiver {
    constructor(props: Props) {
        super(props);

        this.state = {
            status: this.props.invocation.status,
            decorate: false,
            canBeDecorated: false
        };

        this.props.invocation
            .on('data', () => this.setState({ canBeDecorated: this.props.invocation.canBeDecorated() }))
            .on('status', (status: e.Status) => this.setState({ status: status }));

        // FIXME: find a better design to propagate events.
        if (this.props.hasLocusOfAttention) {
            window.invocationUnderAttention = this;
        }
    }

    render() {
        if (this.state.canBeDecorated && this.state.decorate) {
            var buffer = this.props.invocation.decorate();
        } else {
            buffer = React.createElement(BufferComponent, { buffer: this.props.invocation.getBuffer() });
        }

        const classNames = 'invocation ' + this.state.status;

        return React.createElement(
            'div',
            { className: classNames },
            React.createElement(PromptComponent, {
                prompt: this.props.invocation.getPrompt(),
                status: this.state.status,
                hasLocusOfAttention: this.props.hasLocusOfAttention,
                invocation: this.props.invocation,
                invocationView: this
            }),
            buffer
        );
    }

    handleKeyDown(event: KeyboardEvent): void {
        if (this.state.status === e.Status.InProgress && !isMetaKey(event)) {
            if (keys.interrupt(event)) {
                this.props.invocation.interrupt()
            } else {
                this.props.invocation.write(event);
            }

            event.stopPropagation();
            event.preventDefault();
            return;
        }

        // FIXME: find a better design to propagate events.
        window.promptUnderAttention.handleKeyDown(event);
    }
}

export function isMetaKey(event: KeyboardEvent) {
    return event.metaKey || _.some([event.key, (<any>event).keyIdentifier],
            key => _.includes(['Shift', 'Alt', 'Ctrl'], key));
}
