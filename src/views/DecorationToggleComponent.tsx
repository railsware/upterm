import * as React from "react";
import {stopBubblingUp} from "./ViewUtils";
import Job from "./3_JobComponent";

interface Props {
    job: Job;
}

interface State {
    enabled: boolean;
}

export default class DecorationToggleComponent extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = { enabled: this.props.job.state.decorate };
    }

    handleClick(event: KeyboardEvent) {
        stopBubblingUp(event);

        const newState = !this.state.enabled;
        this.setState({ enabled: newState });
        this.props.job.setState({ decorate: newState });
    }

    render() {
        let classes = ["decoration-toggle"];

        if (!this.state.enabled) {
            classes.push("disabled");
        }

        return (
            <a className={classes.join(" ")} onClick={this.handleClick.bind(this)}>
                <i className="fa fa-magic"></i>
            </a>
        );
    }
}
