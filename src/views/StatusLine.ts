import * as React from 'react';
import * as i from '../Interfaces';

interface StatusLineProps {
    currentWorkingDirectory: string;
    vcsData: i.VcsData;
}

export default class StatusLine extends React.Component<StatusLineProps, {}> {
    render() {
        return React.createElement('div', {className: 'status-line'},
            React.createElement(CurrentDirectory, {currentWorkingDirectory: this.props.currentWorkingDirectory}),
            React.createElement(VcsData, {data: this.props.vcsData})
        );
    }
}


interface CurrentDirectoryProps {
    currentWorkingDirectory: string;
}

class CurrentDirectory extends React.Component<CurrentDirectoryProps, {}> {
    render() {
        return React.createElement('div', {className: 'current-directory'}, this.props.currentWorkingDirectory);
    }
}


interface VcsDataProps {
    data: i.VcsData;
}

class VcsData extends React.Component<VcsDataProps, {}> {
    render() {
        if (!this.props.data.isRepository) {
            return null;
        }

        return React.createElement('div', {className: 'vcs-data'},
            React.createElement('div', {className: `status ${this.props.data.status}`}, this.props.data.branch)
        );
    }
}

