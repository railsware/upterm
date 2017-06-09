import * as React from "react";
import {Job} from "../shell/Job";
import {BufferComponent} from "./BufferComponent";
import {JobHeaderComponent} from "./JobHeaderComponent";
import {Status} from "../Enums";

interface Props {
    job: Job;
    jobStatus: Status;
    isFocused: boolean;
}

interface State {
    prettify: boolean;
}

export class JobShowComponent extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            prettify: true,
        };
    }

    componentDidMount() {
        this.props.job
            .on("data", () => this.forceUpdate())
            .on("status", () => this.forceUpdate());
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        return this.state.prettify !== nextState.prettify ||
            this.props.jobStatus === Status.InProgress ||
            this.props.jobStatus !== nextProps.jobStatus;
    }

    render() {
        let buffer: React.ReactElement<any>;
        let canBePrettified = this.props.job.canBePrettified();
        if (this.props.job.interceptionResult && this.state.prettify) {
            buffer = this.props.job.interceptionResult;
        } else if (canBePrettified && this.state.prettify) {
            buffer = this.props.job.prettify();
        } else {
            buffer = <BufferComponent job={this.props.job}/>;
        }

        return (
            <div className={"job"}>
                <JobHeaderComponent
                    job={this.props.job}
                    showPrettifyToggle={!!this.props.job.interceptionResult || canBePrettified}
                    prettifyToggler={() => {
                        if (this.props.job.interceptionResult) {
                            // Re-execute without intercepting
                            this.props.job.execute({ allowInterception: false });
                        }
                        // Show not prettified output
                        this.setState({prettify: !this.state.prettify});
                    }}
                    isPrettified={this.state.prettify}
                 />
                {buffer}
            </div>
        );
    }
}
