import * as React from "react";

interface StatusLineProps {
    currentWorkingDirectory: string;
    vcsData: VcsData;
}

export default class StatusLine extends React.Component<StatusLineProps, {}> {
    render() {
        return React.createElement(
            "div",
            { className: "status-line" },
            React.createElement(CurrentDirectory, { currentWorkingDirectory: this.props.currentWorkingDirectory }),
            React.createElement(VcsDataComponent, { data: this.props.vcsData })
        );
    }
}


interface CurrentDirectoryProps {
    currentWorkingDirectory: string;
}

class CurrentDirectory extends React.Component<CurrentDirectoryProps, {}> {
    render() {
        return React.createElement("div", { className: "current-directory" }, this.props.currentWorkingDirectory);
    }
}


interface VcsDataProps {
    data: VcsData;
}

class VcsDataComponent extends React.Component<VcsDataProps, {}> {
    render() {
        if (!this.props.data.isRepository) {
            return undefined;
        }

        return React.createElement(
            "div",
            { className: "vcs-data" },
            React.createElement("div", { className: `status ${this.props.data.status}` }, this.props.data.branch)
        );
    }
}

