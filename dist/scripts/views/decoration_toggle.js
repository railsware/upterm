'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

exports['default'] = _react2['default'].createClass({
    displayName: 'decoration_toggle',

    getInitialState: function getInitialState() {
        return { enabled: this.props.invocation.state.decorate };
    },
    handleClick: function handleClick(event) {
        stopBubblingUp(event);

        var newState = !this.state.enabled;
        this.setState({ enabled: newState });
        this.props.invocation.setState({ decorate: newState });
    },
    render: function render() {
        var classes = ['decoration-toggle'];

        if (!this.state.enabled) {
            classes.push('disabled');
        }

        return _react2['default'].createElement(
            'a',
            { href: '#', className: classes.join(' '), onClick: this.handleClick },
            _react2['default'].createElement('i', { className: 'fa fa-magic' })
        );
    }
});
module.exports = exports['default'];