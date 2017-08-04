import * as React from "react";
import * as _ from "lodash";
import {SessionID} from "../shell/Session";
import {Job} from "../shell/Job";
import {JobComponent} from "./JobComponent";
import * as css from "./css/styles";
import {PromptComponent} from "./PromptComponent";
import {Status} from "../Enums";
import {userFriendlyPath} from "../utils/Common";
import {shell} from "electron";
import {services} from "../services/index";
import {colors} from "./css/colors";
import {Subscription} from "rxjs/Subscription";

interface Props {
    sessionID: SessionID;
    isFocused: boolean;
    focus: () => void;
}

export class SessionComponent extends React.Component<Props, {}> {
    RENDER_JOBS_COUNT = 25;
    promptComponent: PromptComponent | undefined;

    constructor(props: Props) {
        super(props);
    }

    componentDidMount() {
        this.resizeSession();

        this.session.on("jobs-changed", () => {
            if (this.sessionRef && this.footerRef) {
                if (this.sessionRef.scrollHeight - this.sessionRef.offsetHeight - this.sessionRef.scrollTop > this.footerRef.clientHeight) {
                    // If we are already close to the bottom,
                    // scroll all the way to the bottom
                    this.sessionRef.scrollTop = this.sessionRef.scrollHeight;
                }
            }
            this.forceUpdate();
        });
    }

    render() {
        const jobs = _.takeRight(this.session.jobs, this.RENDER_JOBS_COUNT).slice().reverse().map((job: Job, index: number) =>
            <JobComponent
                key={job.id}
                job={job}
                jobStatus={job.status}
                isFocused={this.props.isFocused && index === this.session.jobs.length - 1}
            />,
        );

        const lastJob = _.last(this.session.jobs);
        const lastJobInProgress = lastJob && lastJob.status === Status.InProgress;

        const promptComponent = lastJobInProgress ? undefined : <PromptComponent
            key={this.session.jobs.length}
            ref={component => {
                this.promptComponent = component!;
            }}
            session={this.session}
            isFocused={this.props.isFocused}
        />;

        return (
            <div className="session"
                 data-status={lastJob && lastJob.status}
                 ref="session"
                 onClick={this.handleClick.bind(this)}>

                <div className="jobs">
                    {jobs}
                </div>
                {this.props.isFocused ? null : <div className="shutter"/>}
                {promptComponent}
                <div className="footer" ref="footer">
                    <span className="present-directory">{userFriendlyPath(this.session.directory)}</span>
                    <GitStatusComponent directory={this.session.directory}/>
                    <ReleaseComponent/>
                </div>
            </div>
        );
    }

    resizeSession(): void {
        this.session.dimensions = {
            columns: Math.floor(this.size.width / services.font.letterWidth),
            rows: Math.floor(this.size.height / services.font.letterHeight),
        };
    }

    private get session() {
        return services.sessions.get(this.props.sessionID);
    }

    private get sessionRef() {
        return this.refs.session as HTMLDivElement | undefined;
    }

    private get footerRef() {
        return this.refs.footer as HTMLDivElement | undefined;
    }

    private handleClick() {
        if (!this.props.isFocused) {
            this.props.focus();
        }
    }

    private get size(): Size {
        if (this.sessionRef && this.footerRef) {
            return {
                width: this.sessionRef.clientWidth - (2 * css.contentPadding),
                height: this.sessionRef.clientHeight - this.footerRef.clientHeight,
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

type GitStatusProps = { directory: string };

class GitStatusComponent extends React.Component<GitStatusProps, GitState> {
    private subscription: Subscription;

    constructor(props: GitStatusProps) {
        super(props);

        this.state = {
            kind: "not-repository",
        };
    }

    componentDidMount() {
        this.subscribe(this.props.directory);
    }

    componentWillUpdate(nextProps: GitStatusProps) {
        if (this.props.directory !== nextProps.directory) {
            this.subscription.unsubscribe();
            this.subscribe(nextProps.directory);
        }
    }

    componentWillUnmount() {
        this.subscription.unsubscribe();
    }

    render() {
        if (this.state.kind === "repository") {
            return (
                <span className="vcs-data" style={{color: this.state.status === "dirty" ? colors.blue : colors.white}}>
                {this.state.branch}
            </span>
            );
        } else {
            return null;
        }
    }

    private subscribe(directory: string) {
        this.subscription = services.git.observableFor(directory).subscribe((data: GitState) => {
            this.setState(data);
        });
    }
}

const ReleaseComponent = () => {
    if (process.env.NODE_ENV === "production" && services.updates.isAvailable) {
        return (
            <span
                className="release-component-link"
                onClick={() => shell.openExternal("http://l.rw.rw/upterm_releases")}>
                Download New Release
            </span>
        );
    } else {
        return null;
    }
};
