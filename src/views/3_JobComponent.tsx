import * as React from "react";
import {Job} from "../shell/Job";
import {PromptComponent} from "./4_PromptComponent";
import {BufferComponent} from "./BufferComponent";
import {Status} from "../Enums";

interface Props {
    job: Job;
    isFocused: boolean;
}

interface State {
    decorate: boolean;
}

export const decorateByDefault = true;

export class JobComponent extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            decorate: decorateByDefault,
        };

        // FIXME: find a better design to propagate events.
        if (this.props.isFocused) {
            window.focusedJob = this;
        }
    }

    componentDidMount() {
        this.props.job
            .on("data", () => this.forceUpdate())
            .on("status", () => this.forceUpdate());
    }

    componentDidUpdate() {
        // FIXME: find a better design to propagate events.
        if (this.props.isFocused) {
            window.focusedJob = this;
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
                                 isFocused={this.props.isFocused}
                                 decorateToggler={() => {
                                     const newDecorate = !this.state.decorate;
                                     this.setState({decorate: newDecorate});
                                     return newDecorate;
                                 }}/>
                {buffer}
            </div>
        );
    }
}
