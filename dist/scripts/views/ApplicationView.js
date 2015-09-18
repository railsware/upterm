var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Application_1 = require('../Application');
var TerminalComponent_1 = require('./TerminalComponent');
var React = require('react');
var remote = require('remote');
var ApplicationView = (function (_super) {
    __extends(ApplicationView, _super);
    function ApplicationView(props) {
        _super.call(this, props);
        this.browserWindow = remote.getCurrentWindow();
        this.restoreState();
        this.state = { application: new Application_1.default(this.charSize, this.contentSize) };
        this.subscribeToEvents();
    }
    ApplicationView.prototype.handleKeyDown = function (event) {
        if (event.metaKey && event.keyCode === 189) {
            console.log('Split horizontally.');
            event.stopPropagation();
            event.preventDefault();
        }
        if (event.metaKey && event.keyCode === 220) {
            console.log('Split vertically.');
            event.stopPropagation();
            event.preventDefault();
        }
    };
    ApplicationView.prototype.render = function () {
        var terminals = this.state.application.terminals.map(function (terminal, index) { return React.createElement(TerminalComponent_1.default, { "terminal": terminal, "key": index }); });
        return React.createElement("div", {
            className: "application",
            onKeyDown: this.handleKeyDown.bind(this)
        }, terminals);
    };
    Object.defineProperty(ApplicationView.prototype, "contentSize", {
        get: function () {
            return {
                width: window.innerWidth,
                height: window.innerHeight,
            };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ApplicationView.prototype, "charSize", {
        get: function () {
            var letter = document.getElementById('sizes-calculation');
            return {
                width: letter.clientWidth + 0.5,
                height: letter.clientHeight,
            };
        },
        enumerable: true,
        configurable: true
    });
    ;
    ApplicationView.prototype.restoreState = function () {
        var contentSize = JSON.parse(localStorage.getItem('content-size'));
        if (contentSize) {
            this.browserWindow.setContentSize(contentSize.width, contentSize.height);
        }
        var windowPosition = JSON.parse(localStorage.getItem('window-position'));
        if (windowPosition) {
            (_a = this.browserWindow).setPosition.apply(_a, windowPosition);
        }
        var _a;
    };
    ;
    ApplicationView.prototype.subscribeToEvents = function () {
        var _this = this;
        this.browserWindow.on('move', function () {
            localStorage.setItem('window-position', JSON.stringify(_this.browserWindow.getPosition()));
        });
        $(window).resize(function () {
            localStorage.setItem('content-size', JSON.stringify(_this.contentSize));
            _this.state.application.contentSize = _this.contentSize;
        });
    };
    ;
    return ApplicationView;
})(React.Component);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ApplicationView;
