import * as React from "react";

const CurrentDirectory = ({currentWorkingDirectory}: { currentWorkingDirectory: string }) =>
    <div className="current-directory">{currentWorkingDirectory}</div>;

const VcsDataComponent = ({data}: { data: VcsData }) => {
    if (this.props.data.isRepository) {
        return (
            <div className="vcs-data">
                <div className={`status ${data.status}`}>{data.branch}</div>
            </div>
        );
    }
};

const StatusLine = ({currentWorkingDirectory, vcsData}: { currentWorkingDirectory: string; vcsData: VcsData }) =>
    <div className="status-line">
        <CurrentDirectory currentWorkingDirectory={currentWorkingDirectory}/>
        <VcsDataComponent data={vcsData}/>
    </div>;

export default StatusLine;
