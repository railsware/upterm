var jQuery = require('jquery');
var Terminal = require('./compiled/terminal');
var React = require('react');

jQuery(document).ready(function () {
    window.terminal = new Terminal(getDimensions());

    jQuery(window).resize(function() {
        terminal.resize(getDimensions());
    });

    React.render(<Board terminal={window.terminal}/>, document.getElementById('black-board'));
});

var Board = React.createClass({
    componentDidMount: function () {
        this.props.terminal.on('invocation', this.forceUpdate.bind(this));
    },
    handleKeyDown: function (event) {
        // Ctrl+l
        if (event.ctrlKey && event.keyCode === 76) {
            this.props.terminal.clearInvocations();
            event.stopPropagation();
        }
    },
    render: function () {
        var invocations = this.props.terminal.invocations.map(function (invocation) {
            return (
                <Invocation key={invocation.id} invocation={invocation}/>
            )
        });
        return (
            <div id="board" onKeyDown={this.handleKeyDown}>
                <div id="invocations">
                    {invocations}
                </div>
                <StatusLine currentWorkingDirectory={this.props.terminal.currentDirectory}/>
            </div>
        );
    }
});

var Invocation = React.createClass({
    componentDidMount: function () {
        this.props.invocation.on('data', function () {
            this.forceUpdate();
        }.bind(this));
    },
    componentDidUpdate: scrollToBottom,
    render: function () {
        var buffer;

        try {
            buffer = <JSONTree data={ JSON.parse(this.props.invocation.getBuffer().toString()) } />;
        } catch(exception) {
            buffer = this.props.invocation.getBuffer().render();
        }

        return (
            <div className="invocation">
                <Prompt prompt={this.props.invocation.getPrompt()}/>
                {buffer}
            </div>
        );
    }
});

var Prompt = React.createClass({
    getInputNode: function () {
        return this.refs.command.getDOMNode()
    },
    handleKeyDown: function (event) {
        if (event.keyCode == 13) {
            this.props.prompt.send(this.getInputNode().value);
            event.stopPropagation();
        }

        // Ctrl+P, ↑.
        if ((event.ctrlKey && event.keyCode === 80) || event.keyCode === 38) {
            var prevCommand = this.props.prompt.history.getPrevious();
            if (typeof prevCommand != 'undefined') {
                this.getInputNode().value = prevCommand;
            }
            event.stopPropagation();
        }

        // Ctrl+N, ↓.
        if ((event.ctrlKey && event.keyCode === 78) || event.keyCode === 40) {
            var command = this.props.prompt.history.getNext();
            this.getInputNode().value = command || '';
            event.stopPropagation();
        }
    },
    render: function () {
        return (
            <div className="prompt">
                <div className="prompt-decoration">
                    <div className="arrow"></div>
                </div>
                <input onKeyDown={this.handleKeyDown} type="text" ref="command" autoFocus="autofocus"/>
            </div>
        )
    }
});

var StatusLine = React.createClass({
    render: function () {
        return (
            <div id="status-line">
                <CurrentDirectory currentWorkingDirectory={this.props.currentWorkingDirectory}/>
            </div>
        )
    }
});

var CurrentDirectory = React.createClass({
    render: function () {
        return (
            <div id="current-directory">{this.props.currentWorkingDirectory}</div>
        )
    }
});

function getDimensions() {
    var letter = document.getElementById('sizes-calculation');
    return {
        columns: Math.floor(window.innerWidth / letter.clientWidth * 10),
        rows:    Math.floor(window.innerHeight / letter.clientHeight)
    };
}

function scrollToBottom() {
    jQuery('html body').animate({ scrollTop: jQuery(document).height() }, 0);
}
