import * as React from "react";
import * as _ from "lodash";
import {Session} from "../shell/Session";
import {Job} from "../shell/Job";
import {JobShowComponent} from "./3_JobShowComponent";
import * as css from "./css/main";
import {JobFormComponent} from "./3_JobFormComponent";
import {Status} from "../Enums";

interface Props {
    session: Session;
    isFocused: boolean;
    focus: () => void;
    updateStatusBar: (() => void) | undefined; // Only the focused session can update the status bar.
}

// The height to snap to bottom when scroll. TODO: Make this the actual height
const FOOTER_HEIGHT = 50;

export class SessionComponent extends React.Component<Props, {}> {
    RENDER_JOBS_COUNT = 25;

    private _jobFormComponent: JobFormComponent;

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
                if (this.props.updateStatusBar) {
                    this.props.updateStatusBar();
                }
            })
            .on("vcs-data", () => this.props.updateStatusBar && this.props.updateStatusBar());
    }

    jobFormComponent(): JobFormComponent | undefined {
        return this._jobFormComponent;
    }

    render() {
        const jobs = _.takeRight(this.props.session.jobs, this.RENDER_JOBS_COUNT).map((job: Job, index: number) =>
            <JobShowComponent
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

        const jobFormComponent = lastJobInProgress ? undefined : <JobFormComponent
            key={this.props.session.jobs.length}
            ref={component => { this._jobFormComponent = component; }}
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
                    {jobFormComponent}
                    </div>
                <div className="shutter" style={css.sessionShutter(this.props.isFocused)}></div>
            </div>
        );
    }

    private handleClick() {
        if (!this.props.isFocused) {
            this.props.focus();
        }
    }
}
