import * as React from "react";
import * as _ from "lodash";
import Session from "../Session";
import Job from "../Job";
import StatusLineComponent from "./StatusLineComponent";
import JobComponent from "./3_JobComponent";
import {KeyCode} from "../Enums";
import {css} from "./css/main";

interface Props {
    session: Session;
    isActive: boolean;
    activate: () => void;
}

interface State {
    vcsData?: VcsData;
    jobs?: Job[];
}

export default class SessionComponent extends React.Component<Props, State> {
    RENDER_JOBS_COUNT = 25;

    constructor(props: Props) {
        super(props);

        this.state = {
            vcsData: {isRepository: false},
            jobs: this.props.session.jobs,
        };
    }

    componentDidMount() {
        this.props.session
            .on("job", () => this.setState({jobs: this.props.session.jobs}))
            .on("vcs-data", (data: VcsData) => this.setState({vcsData: data}));
    }

    render() {
        const jobs = _.takeRight(this.state.jobs, this.RENDER_JOBS_COUNT).map((job: Job, index: number) =>
            <JobComponent key={job.id}
                          job={job}
                          hasLocusOfAttention={this.props.isActive && index === this.state.jobs.length - 1}/>
        );

        return (
            <div className={`session ${(this.props.isActive ? "active" : "inactive")}`}
                 tabIndex={0}
                 onClickCapture={this.handleClick.bind(this)}
                 onKeyDownCapture={this.handleKeyDown.bind(this)}>

                <div style={css.jobs(this.props.isActive)}>{jobs}</div>
                <StatusLineComponent currentWorkingDirectory={this.props.session.directory}
                                     vcsData={this.state.vcsData}/>
            </div>
        );
    }

    private handleClick() {
        if (!this.props.isActive) {
            this.props.activate();
        }
    }

    private handleKeyDown(event: KeyboardEvent) {
        if (event.ctrlKey && event.keyCode === KeyCode.L) {
            this.props.session.clearJobs();

            event.stopPropagation();
            return;
        }

        // Cmd+D.
        if (event.metaKey && event.keyCode === KeyCode.D) {
            window.DEBUG = !window.DEBUG;

            require("devtron").install();

            event.stopPropagation();
            this.forceUpdate();

            console.log(`Debugging mode has been ${window.DEBUG ? "enabled" : "disabled"}.`);
            return;
        }

        // FIXME: find a better design to propagate events.
        window.jobUnderAttention.handleKeyDown(event);
    }
}
