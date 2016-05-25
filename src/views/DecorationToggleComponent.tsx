import * as React from "react";
import {stopBubblingUp} from "./ViewUtils";
import Job from "./3_JobComponent";
import {css} from "./css/main";
import {fontAwesome} from "./css/FontAwesome";

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
        return (
            <i style={css.decorationToggle(this.state.enabled)}
               onClick={this.handleClick.bind(this)}
               dangerouslySetInnerHTML={{__html: fontAwesome.magic}}/>
        );
    }
}
