import React from 'react';

export default React.createClass({
    render() {
        return (
            <div id="status-line">
                <CurrentDirectory currentWorkingDirectory={this.props.currentWorkingDirectory}/>
                <VcsData data={this.props.vcsData}/>
            </div>
        )
    }
});


const CurrentDirectory = React.createClass({
    render() {
        return (
            <div className="current-directory">{this.props.currentWorkingDirectory}</div>
        )
    }
});

const VcsData = React.createClass({
    render() {
        if (!this.props.data.isRepository) {
            return null;
        }

        return (
            <div className="vcs-data">
                <div className={`status ${this.props.data.status}`}>{this.props.data.branch}</div>
            </div>
        )
    }
});
