import * as React from "react";
import * as e from "../Enums";
import JobModel from "../Job";
import {keys} from "./ViewUtils";
import PromptComponent from "./4_PromptComponent";
import BufferComponent from "./BufferComponent";

interface Props {
    job: JobModel;
    hasLocusOfAttention: boolean;
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

        // FIXME: find a better design to propagate events.
        if (this.props.hasLocusOfAttention) {
            window.jobUnderAttention = this;
        }
    }

    componentDidMount() {
        this.props.job
            .on("data", () => this.setState({canBeDecorated: this.props.job.canBeDecorated()}))
            .on("status", (status: e.Status) => this.setState({status: status}));
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
            buffer = <BufferComponent buffer={this.props.job.buffer}/>;
        }

        return (
            <div className={"job " + this.state.status}>
                <PromptComponent job={this.props.job}
                                 status={this.state.status}
                                 hasLocusOfAttention={this.props.hasLocusOfAttention}
                                 jobView={this}/>
                {buffer}
            </div>
        );
    }

    handleKeyDown(event: KeyboardEvent): void {
        if (event.metaKey) {
            event.stopPropagation();
            return;
        }

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
    return event.metaKey || [event.key, event.keyIdentifier].some(key => ["Shift", "Alt", "Control"].includes(key));
}
