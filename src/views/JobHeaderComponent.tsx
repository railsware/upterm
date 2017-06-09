import * as React from "react";
import {FloatingMenu} from "./FloatingMenu";
import {PrettifyToggleComponent} from "./PrettifyToggleComponent";
import {Job} from "../shell/Job";
import {Button} from "../plugins/autocompletion_utils/Button";
import * as css from "./css/main";
import {fontAwesome} from "./css/FontAwesome";
import {Status} from "../Enums";

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
        let scrollToTop: any;
        let jobMenuButton: any;

        if (this.props.showPrettifyToggle) {
            prettifyToggle = <PrettifyToggleComponent
                prettifyToggler={this.props.prettifyToggler}
                isPrettified={this.props.isPrettified}
            />;
        }

        jobMenuButton = <span style={{transform: "translateY(-1px)"}} className="jobMenu">
            <Button
                onClick={() => this.setState({showJobMenu: !this.state.showJobMenu} as State)}
            >•••</Button>
        </span>;

        return <div className="job-header" ref="placeholder" style={css.promptPlaceholder}>
            <div style={css.promptWrapper(this.props.job.status)}>
                <div style={css.arrow(this.props.job.status)}>
                    <div style={css.arrowInner(this.props.job.status)} />
                </div>
                <div
                    style={css.promptInfo(this.props.job.status)}
                    title={JSON.stringify(this.props.job.status)}
                >
                    {this.props.job.status === Status.Interrupted ? fontAwesome.close : ""}
                </div>
                <div
                    style={css.prompt}
                    type="text"
                >
                    {this.props.job.prompt.value}
                    </div>
                <div style={css.actions}>
                    {prettifyToggle}
                    {scrollToTop}
                    {this.props.job.isInProgress() ? jobMenuButton : undefined}
                </div>
                {this.state.showJobMenu ? <FloatingMenu
                    highlightedIndex={0}
                    menuItems={[{
                        text: "Send SIGKILL",
                        action: () => this.props.job.sendSignal("SIGKILL"),
                    }, {
                        text: "Send SIGTERM",
                        action: () => this.props.job.sendSignal("SIGTERM"),
                    }]}
                    hide={() => this.setState({ showJobMenu: false } as any)}
                    offsetTop={this.state.offsetTop}
                /> : undefined}
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
