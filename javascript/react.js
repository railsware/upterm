var jQuery = require('jquery');
var Terminal = require('./compiled/Terminal');
var React = require('react');
var _ = require('lodash');

jQuery(document).ready(function () {
    window.terminal = new Terminal(getDimensions());

    jQuery(window).resize(function() {
        terminal.resize(getDimensions());
    });

    React.render(<Board terminal={window.terminal}/>, document.getElementById('black-board'));

    jQuery(document).keydown(function(event) {
        focusLastInput(event);
    });
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
            this.setState({ canBeDecorated: this.props.invocation.canBeDecorated()});
        }.bind(this));
    },
    componentDidUpdate: scrollToBottom,

    getInitialState: function() {
        return {
            decorate: true,
            canBeDecorated: this.props.invocation.canBeDecorated()
        };
    },
    render: function () {
        var buffer, decorationToggle;

        if (this.state.decorate && this.state.canBeDecorated) {
            buffer = this.props.invocation.decorate();
        } else {
            buffer = this.props.invocation.getBuffer().render();
        }

        if (this.props.invocation.canBeDecorated()) {
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

var DecorationToggle = React.createClass({
    getInitialState: function() {
        return {enabled: this.props.invocation.state.decorate};
    },
    handleClick: function() {
        var newState = !this.state.enabled;
        this.setState({enabled: newState});
        this.props.invocation.setState({decorate: newState});
    },
    render: function () {
        var classes = ['decoration-toggle'];

        if (!this.state.enabled) {
            classes.push('disabled');
        }

        return (
            <a href="#" className={classes.join(' ')} onClick={this.handleClick}>
                <i className="fa fa-magic"></i>
            </a>
        );
    }
});

var Prompt = React.createClass({
    getInputNode: function () {
        return this.refs.command.getDOMNode()
    },
    getValue: function () {
        return this.getInputNode().innerText;
    },
    componentDidMount: function () {
        this.getInputNode().focus();
    },
    handleKeyUp: function (event) {
        this.props.prompt.buffer.setTo(this.getValue());
    },
    handleKeyDown: function (event) {
        if (event.keyCode == 13) {
            this.props.prompt.send(this.getValue());

            event.stopPropagation();
            return false;
        }

        // Ctrl+P, ↑.
        if ((event.ctrlKey && event.keyCode === 80) || event.keyCode === 38) {
            var prevCommand = this.props.prompt.history.getPrevious();

            if (typeof prevCommand != 'undefined') {
                var target = event.target;

                withCaret(target, function(){
                    target.innerText = prevCommand;

                    return target.innerText.length;
                });
            }

            event.stopPropagation();
            return false;
        }

        // Ctrl+N, ↓.
        if ((event.ctrlKey && event.keyCode === 78) || event.keyCode === 40) {
            var command = this.props.prompt.history.getNext();
            target = event.target;

            withCaret(target, function(){
                target.innerText = command || '';

                return target.innerText.length;
            });

            event.stopPropagation();
            return false;
        }
    },
    handleInput: function (event) {
        var target = event.target;

        withCaret(target, function(oldPosition){
            // Do syntax highlighting.
            //target.innerHTML = target.innerHTML.toUpperCase();

            return oldPosition;
        });
    },
    render: function () {
        var classes = ['prompt', this.props.status].join(' ');

        return (
            <div className="prompt-wrapper">
                <div className="prompt-decoration">
                    <div className="arrow"/>
                </div>
                <div className={classes}
                     onKeyDown={this.handleKeyDown}
                     onKeyUp={this.handleKeyUp}
                     onInput={this.handleInput}
                     type="text"
                     ref="command"
                     contentEditable="true" />
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

function focusLastInput(event) {
    if (!_.contains(event.target.classList, 'prompt')) {
        jQuery('.prompt').last().focus();
    }
}

function withCaret(target, callback) {
    var selection = window.getSelection();
    var range = document.createRange();

    var offset = callback(selection.baseOffset);

    if (target.childNodes.length) {
        range.setStart(target.childNodes[0], offset);
    } else {
        range.setStart(target, 0);
    }
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
}
