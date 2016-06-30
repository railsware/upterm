import * as React from "react";
import * as e from "../Enums";
import {Job} from "../shell/Job";
import {keys, isModifierKey} from "./ViewUtils";
import {PromptComponent} from "./4_PromptComponent";
import {BufferComponent} from "./BufferComponent";

interface Props {
    job: Job;
    hasLocusOfAttention: boolean;
}

interface State {
    decorate: boolean;
}

export const decorateByDefault = false;

export class JobComponent extends React.Component<Props, State> implements KeyDownReceiver {
    constructor(props: Props) {
        super(props);

        this.state = {
            decorate: decorateByDefault,
        };

        // FIXME: find a better design to propagate events.
        if (this.props.hasLocusOfAttention) {
            window.jobUnderAttention = this;
        }
    }

    componentDidMount() {
        this.props.job
            .on("data", () => this.forceUpdate())
            .on("status", () => this.forceUpdate());
    }

    componentDidUpdate() {
        // FIXME: find a better design to propagate events.
        if (this.props.hasLocusOfAttention) {
            window.jobUnderAttention = this;
        }
    }

    render() {
        let buffer: React.ReactElement<any>;
        if (this.props.job.canBeDecorated() && this.state.decorate) {
            buffer = this.props.job.decorate();
        } else {
            buffer = <BufferComponent job={this.props.job}/>;
        }

        return (
            <div className={"job"}>
                <PromptComponent job={this.props.job}
                                 status={this.props.job.status}
                                 hasLocusOfAttention={this.props.hasLocusOfAttention}
                                 decorateToggler={() => {
                                     const newDecorate = !this.state.decorate;
                                     this.setState({decorate: newDecorate});
                                     return newDecorate;
                                 }}/>
                {buffer}
            </div>
        );
    }

    handleKeyDown(event: KeyboardEvent): void {
        if (event.metaKey) {
            event.stopPropagation();
            return;
        }

        if (this.props.job.status === e.Status.InProgress && !event.metaKey && !isModifierKey(event)) {
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
