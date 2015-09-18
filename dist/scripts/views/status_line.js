"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

exports["default"] = _react2["default"].createClass({
    displayName: "status_line",

    render: function render() {
        return _react2["default"].createElement(
            "div",
            { className: "status-line" },
            _react2["default"].createElement(CurrentDirectory, { currentWorkingDirectory: this.props.currentWorkingDirectory }),
            _react2["default"].createElement(VcsData, { data: this.props.vcsData })
        );
    }
});

var CurrentDirectory = _react2["default"].createClass({
    displayName: "CurrentDirectory",

    render: function render() {
        return _react2["default"].createElement(
            "div",
            { className: "current-directory" },
            this.props.currentWorkingDirectory
        );
    }
});

var VcsData = _react2["default"].createClass({
    displayName: "VcsData",

    render: function render() {
        if (!this.props.data.isRepository) {
            return null;
        }

        return _react2["default"].createElement(
            "div",
            { className: "vcs-data" },
            _react2["default"].createElement(
                "div",
                { className: "status " + this.props.data.status },
                this.props.data.branch
            )
        );
    }
});
module.exports = exports["default"];