import * as React from "react";
import {PrettifyToggleComponent} from "./PrettifyToggleComponent";
import {Job} from "../shell/Job";
import * as css from "./css/main";

interface Props {
    job: Job;
    prettifyToggler: () => void;
    isPrettified: boolean;
    showPrettifyToggle: boolean;
}

interface State {
    offsetTop: number;
    showJobMenu: boolean;
}


// TODO: Make sure we only update the view when the model changes.
export class JobHeaderComponent extends React.Component<Props, State> {
    /* tslint:disable:member-ordering */
    constructor(props: Props) {
        super(props);

        this.state = {
            offsetTop: 0,
            showJobMenu: false,
        };
    }

    render() {
        // FIXME: write better types.
        let prettifyToggle: any;

        if (this.props.showPrettifyToggle) {
            prettifyToggle = <PrettifyToggleComponent
                prettifyToggler={this.props.prettifyToggler}
                isPrettified={this.props.isPrettified}
            />;
        }

        return <div className="job-header" ref="placeholder">
            <div>
                <div
                    style={css.jobHeader}
                    type="text"
                >
                    {this.props.job.prompt.value}
                </div>
                <div style={css.actions}>
                    {prettifyToggle}
                </div>
            </div>
        </div>;
    }

    scrollIntoView(): void {
        this.placeholderNode.scrollIntoView(true);
    }

    private get placeholderNode(): Element {
        /* tslint:disable:no-string-literal */
        return this.refs["placeholder"] as Element;
    }
}
