import * as React from 'react';
import {stopBubblingUp} from './ViewUtils';
import Invocation from './Invocation';

interface Props {
    invocation: Invocation;
}

interface State {
    enabled: boolean;
}

export default class DecorationToggle extends React.Component<Props, State> {
    constructor(props) {
        super(props);

        this.state = {enabled: this.props.invocation.state.decorate};
    }

    handleClick(event) {
        stopBubblingUp(event);

        const newState = !this.state.enabled;
        this.setState({enabled: newState});
        this.props.invocation.setState({decorate: newState});
    }

    render() {
        var classes = ['decoration-toggle'];

        if (!this.state.enabled) {
            classes.push('disabled');
        }

        return React.createElement(
            'a',
            {href: '#', className: classes.join(' '), onClick: this.handleClick},
            React.createElement('i', {className: 'fa fa-magic'})
        );
    }
}
