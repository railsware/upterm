import * as React from "react";
import * as e from "../Enums";
import * as _ from "lodash";
import JobModel from "../Job";
import {keys} from "./ViewUtils";
import PromptComponent from "./4_PromptComponent";
import BufferComponent from "./BufferComponent";

interface Props {
    job: JobModel;
    hasLocusOfAttention: boolean;
    key: number;
}

interface State {
    status?: e.Status;
    canBeDecorated?: boolean;
    decorate?: boolean;
}

export default class JobComponent extends React.Component<Props, State> implements KeyDownReceiver {
    constructor(props: Props) {
        super(props);

        this.state = {
            status: this.props.job.status,
            decorate: false,
            canBeDecorated: false,
        };

        this.props.job
            .on("data", () => this.setState({ canBeDecorated: this.props.job.canBeDecorated() }))
            .on("status", (status: e.Status) => this.setState({ status: status }));

        // FIXME: find a better design to propagate events.
        if (this.props.hasLocusOfAttention) {
            window.jobUnderAttention = this;
        }
    }

    componentDidUpdate() {
        // FIXME: find a better design to propagate events.
        if (this.props.hasLocusOfAttention) {
            window.jobUnderAttention = this;
        }
    }

    render() {
        let buffer: React.ReactElement<any>;
        if (this.state.canBeDecorated && this.state.decorate) {
            buffer = this.props.job.decorate();
        } else {
            buffer = React.createElement(BufferComponent, { buffer: this.props.job.getBuffer() });
        }

        const classNames = "job " + this.state.status;

        return React.createElement(
            "div",
            { className: classNames },
            React.createElement(PromptComponent, {
                prompt: this.props.job.prompt,
                status: this.state.status,
                hasLocusOfAttention: this.props.hasLocusOfAttention,
                jobView: this,
            }),
            buffer
        );
    }

    handleKeyDown(event: KeyboardEvent): void {
        if (this.state.status === e.Status.InProgress && !isMetaKey(event)) {
            if (keys.interrupt(event)) {
                this.props.job.interrupt();
            } else {
                this.props.job.write(event);
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
                                   key => ["Shift", "Alt", "Ctrl"].includes(key));
}
