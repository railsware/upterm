import * as React from 'react';
import * as _ from 'lodash';
import Terminal from '../Terminal';
import Job from '../Job';
import StatusLineComponent from './StatusLineComponent';
import JobComponent from './3_JobComponent';

interface Props {
    terminal: Terminal;
    isActive: boolean;
    activateTerminal: (t: Terminal) => void;
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
            vcsData: { isRepository: false },
            jobs: this.props.terminal.jobs
        }
    }

    componentWillMount() {
        this.props.terminal
            .on('job', () => this.setState({ jobs: this.props.terminal.jobs }))
            .on('vcs-data', (data: VcsData) => this.setState({ vcsData: data }));
    }

    render() {
        var jobs = _.takeRight(this.state.jobs, this.RENDER_JOBS_COUNT).map((job: Job, index: number) =>
            React.createElement(JobComponent, {
                key: job.id,
                job: job,
                hasLocusOfAttention: this.props.isActive && index === this.state.jobs.length - 1
            }, [])
        );

        let activenessClass = this.props.isActive ? 'active' : 'inactive';

        return React.createElement('div', {
                className: `terminal ${activenessClass}`,
                tabIndex: 0,
                onClickCapture: this.handleClick.bind(this),
                onKeyDownCapture: this.handleKeyDown.bind(this)
            },
            React.createElement('div', { className: 'jobs' }, jobs),
            React.createElement(StatusLineComponent, {
                currentWorkingDirectory: this.props.terminal.currentDirectory,
                vcsData: this.state.vcsData
            })
        );
    }

    private handleClick() {
        if (!this.props.isActive) {
            this.props.activateTerminal(this.props.terminal);
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

            console.log(`Debugging mode has been ${window.DEBUG ? 'enabled' : 'disabled'}.`);
            return;
        }

        // FIXME: find a better design to propagate events.
        window.jobUnderAttention.handleKeyDown(event);
    }
}
