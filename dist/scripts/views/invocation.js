'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _prompt = require('./prompt');

var _prompt2 = _interopRequireDefault(_prompt);

exports['default'] = _react2['default'].createClass({
    displayName: 'invocation',

    componentWillMount: function componentWillMount() {
        var _this = this;

        this.props.invocation.on('data', function (_) {
            return _this.setState({ canBeDecorated: _this.props.invocation.canBeDecorated() });
        }).on('status', function (status) {
            return _this.setState({ status: status });
        });
    },
    componentDidUpdate: scrollToBottom,

    getInitialState: function getInitialState() {
        return {
            status: this.props.invocation.status,
            decorate: false,
            canBeDecorated: false
        };
    },
    render: function render() {
        if (this.state.canBeDecorated && this.state.decorate) {
            var buffer = this.props.invocation.decorate();
        } else {
            buffer = this.props.invocation.getBuffer().render();
        }

        var classNames = 'invocation ' + this.state.status;
        return _react2['default'].createElement(
            'div',
            { className: classNames },
            _react2['default'].createElement(_prompt2['default'], { prompt: this.props.invocation.getPrompt(),
                status: this.state.status,
                invocation: this.props.invocation,
                invocationView: this }),
            buffer
        );
    }
});
module.exports = exports['default'];