import * as React from "react";
import * as _ from "lodash";
import {Session} from "../shell/Session";
import {Job} from "../shell/Job";
import {JobComponent} from "./JobComponent";
import * as css from "./css/styles";
import {PromptComponent} from "./PromptComponent";
import {Status} from "../Enums";
import {userFriendlyPath} from "../utils/Common";
import {watchManager} from "../plugins/GitWatcher";
import {shell} from "electron";
import {ReleaseTracker} from "../services/ReleaseTracker";

interface Props {
    session: Session;
    isFocused: boolean;
    focus: () => void;
    updateFooter: (() => void) | undefined; // Only the focused session can update the status bar.
}

export class PaneComponent extends React.Component<Props, {}> {
    RENDER_JOBS_COUNT = 25;
    promptComponent: PromptComponent | undefined;

    constructor(props: Props) {
        super(props);
    }

    componentDidMount() {
        this.updateSessionDimensions();

        this.props.session
            .on("jobs-changed", () => {
                if (this.paneRef && this.footerRef) {
                    if (this.paneRef.scrollHeight - this.paneRef.offsetHeight - this.paneRef.scrollTop > this.footerRef.clientHeight) {
                        // If we are already close to the bottom,
                        // scroll all the way to the bottom
                        this.paneRef.scrollTop = this.paneRef.scrollHeight;
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
            <div className="pane"
                 data-status={lastJob && lastJob.status}
                 ref="pane"
                 style={css.pane(this.props.isFocused)}
                 onClick={this.handleClick.bind(this)}>

                <div className="jobs" style={css.jobs(this.props.isFocused)}>
                    {jobs}
                </div>
                <div className="shutter" style={css.paneShutter(this.props.isFocused)}/>
                {promptComponent}
                <div className="footer" ref="footer">
                    <span className="present-directory">{userFriendlyPath(this.props.session.directory)}</span>
                    <VcsDataComponent data={watchManager.vcsDataFor(this.props.session.directory)}/>
                    <ReleaseComponent />
                </div>
            </div>
        );
    }

    updateSessionDimensions(): void {
        this.props.session.dimensions = this.dimensions;
    }

    private get paneRef() {
        return this.refs.pane as HTMLDivElement | undefined;
    }

    private get footerRef() {
        return this.refs.footer as HTMLDivElement | undefined;
    }

    private handleClick() {
        if (!this.props.isFocused) {
            this.props.focus();
        }
    }

    private get dimensions(): Dimensions {
        return {
            columns: Math.floor(this.size.width / css.letterSize.width),
            rows: Math.floor(this.size.height / css.letterSize.height),
        };
    }

    private get size(): Size {
        if (this.paneRef && this.footerRef) {
            return {
                width: this.paneRef.clientWidth - (2 * css.contentPadding),
                height: this.paneRef.clientHeight - this.footerRef.clientHeight,
            };
        } else {
            // For tests that are run in electron-mocha
            return {
                width: 800,
                height: 600,
            };
        }
    }
}

const VcsDataComponent = ({data}: { data: VcsData }) => {
    if (data.kind === "repository") {
        return (
            <span className="vcs-data" style={css.footer.status(data.status)}>
                {data.branch}
            </span>
        );
    } else {
        return <div/>;
    }
};

const ReleaseComponent = () => {
    if (process.env.NODE_ENV === "production" && ReleaseTracker.instance.isUpdateAvailable) {
        return (
            <span
                className="release-component-link"
                onClick={() => shell.openExternal("http://l.rw.rw/upterm_releases")}>
                Download New Release
            </span>
        );
    } else {
        /* tslint:disable:no-null-keyword */
        return null;
    }
};
