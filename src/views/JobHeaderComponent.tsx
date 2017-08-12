import * as React from "react";
import {PrettifyToggleComponent} from "./PrettifyToggleComponent";
import {Job} from "../shell/Job";

interface Props {
    job: Job;
    prettifyToggler: () => void;
    isPrettified: boolean;
    showPrettifyToggle: boolean;
}


export class JobHeaderComponent extends React.Component<Props, {}> {
    render() {
        const prettifyToggle = this.props.showPrettifyToggle ?
            <PrettifyToggleComponent prettifyToggler={this.props.prettifyToggler} isPrettified={this.props.isPrettified}/> :
            null;

        return (
            <div className="job-header">
                <div>{this.props.job.prompt.value}</div>
                <div className="job-actions">
                    {prettifyToggle}
                </div>
            </div>
        );
    }
}
