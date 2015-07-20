import React from 'react';
import Prompt from './prompt';

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
        if (this.state.canBeDecorated && this.state.decorate) {
            var buffer = this.props.invocation.decorate();
        } else {
            buffer = this.props.invocation.getBuffer().render();
        }

        const classNames = 'invocation ' + this.state.status;
        return (
            <div className={classNames}>
                <Prompt prompt={this.props.invocation.getPrompt()}
                        status={this.state.status}
                        invocation={this.props.invocation}
                        invocationView={this}/>
                {buffer}
            </div>
        );
    }
});
