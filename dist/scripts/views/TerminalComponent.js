var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require('react');
var InvocationComponent = require('./invocation');
var StatusLine = require('./status_line');
var TerminalComponent = (function (_super) {
    __extends(TerminalComponent, _super);
    function TerminalComponent(props) {
        _super.call(this, props);
        this.state = {
            vcsData: { isRepository: false },
            invocations: this.props.terminal.invocations
        };
    }
    TerminalComponent.prototype.componentWillMount = function () {
        var _this = this;
        this.props.terminal
            .on('invocation', function (_) { return _this.setState({ invocations: _this.props.terminal.invocations }); })
            .on('vcs-data', function (data) { return _this.setState({ vcsData: data }); });
    };
    TerminalComponent.prototype.handleKeyDown = function (event) {
        if (event.ctrlKey && event.keyCode === 76) {
            this.props.terminal.clearInvocations();
            event.stopPropagation();
            event.preventDefault();
        }
        if (event.metaKey && event.keyCode === 68) {
            window.DEBUG = !window.DEBUG;
            event.stopPropagation();
            event.preventDefault();
            this.forceUpdate();
            console.log("Debugging mode has been " + (window.DEBUG ? 'enabled' : 'disabled') + ".");
        }
    };
    TerminalComponent.prototype.render = function () {
        var invocations = this.state.invocations.map(function (invocation) {
            return React.createElement(InvocationComponent, { key: invocation.id, invocation: invocation }, []);
        });
        return React.createElement('div', { className: 'terminal', onKeyDown: this.handleKeyDown.bind(this) }, React.createElement('div', { className: 'invocations' }, invocations), React.createElement(StatusLine, { currentWorkingDirectory: this.props.terminal.currentDirectory, vcsData: this.state.vcsData }));
    };
    return TerminalComponent;
})(React.Component);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TerminalComponent;
