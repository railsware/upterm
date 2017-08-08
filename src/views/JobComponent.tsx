import * as React from "react";
import {Job} from "../shell/Job";
import {OutputComponent} from "./OutputComponent";
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

export class JobComponent extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            prettify: true,
        };
    }

    componentDidMount() {
        this.props.job.on("status", () => this.forceUpdate());
        /**
         * Without this a job is below viewport when you
         * scroll up and then execute a job.
         */
        requestAnimationFrame(() => this.jobNode.scrollIntoView());
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        return this.state.prettify !== nextState.prettify ||
            this.props.jobStatus === Status.InProgress ||
            this.props.jobStatus !== nextProps.jobStatus;
    }

    render() {
        let output: React.ReactElement<any>;
        let canBePrettified = this.props.job.canBePrettified();
        if (canBePrettified && this.state.prettify) {
            output = this.props.job.prettify();
        } else {
            output = <OutputComponent job={this.props.job}/>;
        }

        return (
            <div className={"job"} data-status={this.props.job.status} ref="job">
                <JobHeaderComponent
                    job={this.props.job}
                    showPrettifyToggle={canBePrettified}
                    prettifyToggler={() => {
                        // Show not prettified output
                        this.setState({prettify: !this.state.prettify});
                    }}
                    isPrettified={this.state.prettify}
                 />
                {output}
            </div>
        );
    }

    private get jobNode(): HTMLDivElement {
        /* tslint:disable:no-string-literal */
        return this.refs["job"] as HTMLDivElement;
    }
}
