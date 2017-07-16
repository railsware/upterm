import * as React from "react";
import * as _ from "lodash";
import {Session} from "../shell/Session";
import {Job} from "../shell/Job";
import {JobComponent} from "./3_JobComponent";
import * as css from "./css/styles";
import {PromptComponent} from "./PromptComponent";
import {FooterComponent} from "./FooterComponent";
import {Status} from "../Enums";

interface Props {
    session: Session;
    isFocused: boolean;
    focus: () => void;
    updateFooter: (() => void) | undefined; // Only the focused session can update the status bar.
}

// The height to snap to bottom when scroll. TODO: Make this the actual height
const FOOTER_HEIGHT = 50;

export class SessionComponent extends React.Component<Props, {}> {
    RENDER_JOBS_COUNT = 25;
    promptComponent: PromptComponent;

    constructor(props: Props) {
        super(props);
    }

    componentDidMount() {
        this.props.session
            .on("jobs-changed", () => {
                const s = (this.refs as any).session;
                if (s) {
                    if (s.scrollHeight - s.offsetHeight - s.scrollTop > FOOTER_HEIGHT) {
                        // If we are already close to the bottom,
                        // scroll all the way to the bottom
                        s.scrollTop = s.scrollHeight;
                    }
                }
                if (this.props.updateFooter) {
                    this.props.updateFooter();
                }
            })
            .on("vcs-data", () => this.props.updateFooter && this.props.updateFooter());
    }

    render() {
        const jobs = _.takeRight(this.props.session.jobs, this.RENDER_JOBS_COUNT).slice().reverse().map((job: Job, index: number) =>
            <JobComponent
                key={job.id}
                job={job}
                jobStatus={job.status}
                isFocused={this.props.isFocused && index === this.props.session.jobs.length - 1}
            />,
        );

        const lastJob = _.last(this.props.session.jobs);
        const lastJobInProgress = lastJob && lastJob.status === Status.InProgress;

        if (lastJob) {
            lastJob.once("end", () => this.forceUpdate());
        }

        const promptComponent = lastJobInProgress ? undefined : <PromptComponent
            key={this.props.session.jobs.length}
            ref={component => { this.promptComponent = component!; }}
            session={this.props.session}
            isFocused={true}
        />;

        return (
            <div className="session"
                ref="session"
                style={css.session(this.props.isFocused)}
                onClick={this.handleClick.bind(this)}>

                <div className="jobs" style={css.jobs(this.props.isFocused)}>
                    {jobs}
                </div>
                <div className="shutter" style={css.sessionShutter(this.props.isFocused)}/>
                {promptComponent}
                <FooterComponent session={this.props.session}/>
            </div>
        );
    }

    private handleClick() {
        if (!this.props.isFocused) {
            this.props.focus();
        }
    }
}
