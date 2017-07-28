import * as React from "react";
import {PrettifyToggleComponent} from "./PrettifyToggleComponent";
import {Job} from "../shell/Job";
import * as css from "./css/styles";

interface Props {
    job: Job;
    prettifyToggler: () => void;
    isPrettified: boolean;
    showPrettifyToggle: boolean;
}


// TODO: Make sure we only update the view when the model changes.
export class JobHeaderComponent extends React.Component<Props, {}> {
    render() {
        // FIXME: write better types.
        let prettifyToggle: any;

        if (this.props.showPrettifyToggle) {
            prettifyToggle = <PrettifyToggleComponent prettifyToggler={this.props.prettifyToggler}
                                                      isPrettified={this.props.isPrettified}/>;
        }

        return <div className="job-header">
            <div>{this.props.job.prompt.value}</div>
            <div style={css.actions}>{prettifyToggle}</div>
        </div>;
    }
}
