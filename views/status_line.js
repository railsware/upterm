import React from 'react';

export default React.createClass({
    render() {
        return (
            <div id="status-line">
                <CurrentDirectory currentWorkingDirectory={this.props.currentWorkingDirectory}/>
            </div>
        )
    }
});


const CurrentDirectory = React.createClass({
    render() {
        return (
            <div id="current-directory">{this.props.currentWorkingDirectory}</div>
        )
    }
});
