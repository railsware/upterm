import React from 'react';

export default React.createClass({
    getInitialState() {
        return {enabled: this.props.invocation.state.decorate};
    },
    handleClick() {
        var newState = !this.state.enabled;
        this.setState({enabled: newState});
        this.props.invocation.setState({decorate: newState});
    },
    render() {
        var classes = ['decoration-toggle'];

        if (!this.state.enabled) {
            classes.push('disabled');
        }

        return (
            <a href="#" className={classes.join(' ')} onClick={this.handleClick}>
                <i className="fa fa-magic"></i>
            </a>
        );
    }
});
