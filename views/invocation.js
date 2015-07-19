import React from 'react';
import Prompt from './prompt';
import DecorationToggle from './decoration_toggle';

export default React.createClass({
    componentWillMount() {
        this.props.invocation
            .on('data', _ => this.setState({canBeDecorated: this.props.invocation.canBeDecorated()}))
            .on('status', status => this.setState({status: status}));
    },
    componentDidUpdate: scrollToBottom,

    getInitialState() {
        return {
            status: this.props.invocation.status,
            decorate: false,
            canBeDecorated: false
        };
    },
    render() {
        var buffer, decorationToggle;

        if (this.state.canBeDecorated && this.state.decorate) {
            buffer = this.props.invocation.decorate();
        } else {
            buffer = this.props.invocation.getBuffer().render();
        }

        if (this.state.canBeDecorated) {
            decorationToggle = <DecorationToggle invocation={this}/>;
        }

        const classNames = 'invocation ' + this.state.status;
        return (
            <div className={classNames}>
                <Prompt prompt={this.props.invocation.getPrompt()}
                        status={this.state.status}
                        invocation={this.props.invocation}/>
                {decorationToggle}
                {buffer}
            </div>
        );
    }
});
