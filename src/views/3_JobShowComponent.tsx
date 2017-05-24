import * as React from "react";
import {Job} from "../shell/Job";
import {BufferComponent} from "./BufferComponent";
import {JobHeaderComponent} from "./JobHeaderComponent";

interface Props {
    job: Job;
    isFocused: boolean;
}

interface State {
    decorate: boolean;
}

export class JobShowComponent extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            decorate: true,
        };
    }

    componentDidMount() {
        this.props.job
            .on("data", () => this.forceUpdate())
            .on("status", () => this.forceUpdate());
    }

    render() {
        let buffer: React.ReactElement<any>;
        let canBeDecorated = this.props.job.canBeDecorated();
        if (this.props.job.interceptionResult && this.state.decorate) {
            buffer = this.props.job.interceptionResult;
        } else if (canBeDecorated && this.state.decorate) {
            buffer = this.props.job.decorate();
        } else {
            buffer = <BufferComponent job={this.props.job}/>;
        }

        return (
            <div className={"job"}>
                <JobHeaderComponent
                    job={this.props.job}
                    showDecorationToggle={!!this.props.job.interceptionResult || canBeDecorated}
                    decorateToggler={() => {
                        if (this.props.job.interceptionResult) {
                            // Re-execute without intercepting
                            this.props.job.execute({ allowInterception: false });
                        }
                        // Show non-decorated output
                        this.setState({decorate: !this.state.decorate});
                    }}
                    isDecorated={this.state.decorate}
                 />
                {buffer}
            </div>
        );
    }
}
