import React from 'react';
import DecorationToggle from './decoration_toggle';

export default React.createClass({
    componentDidMount() {
        this.props.invocation.on('data', () =>
                this.setState({ canBeDecorated: this.props.invocation.canBeDecorated()})
        );
    },
    componentDidUpdate: scrollToBottom,

    getInitialState() {
        return {
            decorate: true,
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

        return (
            <div className="invocation">
                <Prompt prompt={this.props.invocation.getPrompt()} status={this.props.invocation.status}/>
                {decorationToggle}
                {buffer}
            </div>
        );
    }
});
