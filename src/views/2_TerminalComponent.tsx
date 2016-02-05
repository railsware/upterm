import * as React from "react";
import * as _ from "lodash";
import Terminal from "../Terminal";
import Job from "../Job";
import StatusLineComponent from "./StatusLineComponent";
import JobComponent from "./3_JobComponent";

interface Props {
    terminal: Terminal;
    isActive: boolean;
    activate: () => void;
}

interface State {
    vcsData?: VcsData;
    jobs?: Job[];
}

export default class TerminalComponent extends React.Component<Props, State> {
    RENDER_JOBS_COUNT = 25;

    constructor(props: Props) {
        super(props);

        this.state = {
            vcsData: {isRepository: false},
            jobs: this.props.terminal.jobs,
        };
    }

    componentDidMount() {
        this.props.terminal
            .on("job", () => this.setState({jobs: this.props.terminal.jobs}))
            .on("vcs-data", (data: VcsData) => this.setState({vcsData: data}));
    }

    render() {
        const jobs = _.takeRight(this.state.jobs, this.RENDER_JOBS_COUNT).map((job: Job, index: number) =>
            <JobComponent key={job.id}
                          job={job}
                          hasLocusOfAttention={this.props.isActive && index === this.state.jobs.length - 1}/>
        );

        return (
            <div className={`terminal ${(this.props.isActive ? "active" : "inactive")}`}
                 tabIndex={0}
                 onClickCapture={this.handleClick.bind(this)}
                 onKeyDownCapture={this.handleKeyDown.bind(this)}>

                <div className="jobs">{jobs}</div>
                <StatusLineComponent currentWorkingDirectory={this.props.terminal.currentDirectory}
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
        // Ctrl+L.
        if (event.ctrlKey && event.keyCode === 76) {
            this.props.terminal.clearJobs();

            event.stopPropagation();
            return;
        }

        // Cmd+D.
        if (event.metaKey && event.keyCode === 68) {
            window.DEBUG = !window.DEBUG;

            event.stopPropagation();
            this.forceUpdate();

            console.log(`Debugging mode has been ${window.DEBUG ? "enabled" : "disabled"}.`);
            return;
        }

        // FIXME: find a better design to propagate events.
        window.jobUnderAttention.handleKeyDown(event);
    }
}
