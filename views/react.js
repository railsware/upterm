import Terminal from './compiled/Terminal';
import React from 'react';
import _ from 'lodash';
import Rx from 'rx';
import Board from './compiled/views/board';
import Autocomplete from './compiled/views/autocomplete';

var keys = {
    goUp: event => (event.ctrlKey && event.keyCode === 80) || event.keyCode === 38,
    goDown: event => (event.ctrlKey && event.keyCode === 78) || event.keyCode === 40,
    enter: event => event.keyCode === 13,
    tab: event => event.keyCode === 9
};


var Prompt = React.createClass({
    getInitialState() {
        //TODO: Reset index to 0 when input changes.
        return {
            suggestions: [],
            selectedAutocompleteIndex: 0,
            latestKeyCode: null
        }
    },
    getInputNode() {
        return this.refs.command.getDOMNode()
    },
    componentWillMount() {
        var keysDownStream           = createEventHandler();
        var meaningfulKeysDownStream = keysDownStream.filter(isDefinedKey).map(stopBubblingUp);
        var [navigateAutocompleteStream, navigateHistoryStream] = meaningfulKeysDownStream
            .filter(event => keys.goDown(event) || keys.goUp(event))
            .partition(this.autocompleteIsShown);


        keysDownStream.filter(_.negate(isCommandKey))
                      .forEach(event => this.setState({latestKeyCode: event.keyCode}));

        meaningfulKeysDownStream.filter(keys.enter)
                                .forEach(this.execute);

        meaningfulKeysDownStream.filter(this.autocompleteIsShown)
                                .filter(keys.tab)
                                .forEach(this.selectAutocomplete);

        navigateHistoryStream.forEach(this.navigateHistory);
        navigateAutocompleteStream.forEach(this.navigateAutocomplete);

        this.handlers = {
            onKeyDown: keysDownStream
        }
    },
    componentDidMount() {
        this.getInputNode().focus();
    },
    execute(event) {
        // TODO: Make sure executing an empty command works well.

        // TODO: send input read dynamically.
        var text = event.target.innerText;
        // Prevent two-line input on cd.
        setTimeout(() => this.props.prompt.send(text), 0);
    },
    navigateHistory(event) {
        if (keys.goUp(event)) {
            var prevCommand = this.props.prompt.history.getPrevious();

            if (typeof prevCommand != 'undefined') {
                var target = event.target;

                withCaret(target, () => {
                    target.innerText = prevCommand;

                    return target.innerText.length;
                });
            }
        } else {
            var command = this.props.prompt.history.getNext();
            target = event.target;

            withCaret(target, () => {
                target.innerText = command || '';

                return target.innerText.length;
            });
        }
    },
    navigateAutocomplete(event) {
        if(keys.goUp(event)) {
            this.setState({ selectedAutocompleteIndex: Math.max(0, this.state.selectedAutocompleteIndex - 1) });
        } else {
            this.setState({ selectedAutocompleteIndex: Math.min(this.state.suggestions.length - 1, this.state.selectedAutocompleteIndex + 1) });
        }
    },
    selectAutocomplete(event) {
        var target = event.target;
        var state = this.state;

        withCaret(target, () => {
            target.innerHTML = state.suggestions[state.selectedAutocompleteIndex] + '&nbsp;';

            // TODO: replace only the current token.
            return target.innerText.length;
        });
        // TODO: remove forceUpdate.
        this.forceUpdate();
    },
    handleInput(event) {
        var target = event.target;
        this.props.prompt.buffer.setTo(target.innerText);

        //withCaret(target, function(oldPosition){
        //    // Do syntax highlighting.
        //    target.innerText = target.innerText.toUpperCase();
        //    return oldPosition;
        //});

        this.setState({ suggestions: this.props.prompt.getSuggestions()});
    },
    currentToken() {
        // TODO: return only the token under cursor.
        return this.getInputNode().innerText.split(/\s+/).pop();
    },
    showAutocomplete() {
        //TODO: use streams.
        return this.refs.command &&
            this.state.suggestions.length &&
            this.currentToken().length &&
            this.props.status == 'not-started' &&
            this.state.latestKeyCode != 13 &&
            this.state.latestKeyCode != 27 &&
            this.state.latestKeyCode != 9;
    },
    autocompleteIsShown() {
        return this.refs.autocomplete;
    },
    render() {
        var classes = ['prompt-wrapper', this.props.status].join(' ');

        if (this.showAutocomplete()) {
            var autocomplete = <Autocomplete suggestions={this.state.suggestions}
                                             caretPosition={$(this.getInputNode()).caret('offset')}
                                             selectedIndex={this.state.selectedAutocompleteIndex}
                                             ref="autocomplete" />;
        }

        return (
            <div className={classes}>
                <div className="prompt-decoration">
                    <div className="arrow"/>
                </div>
                <div className="prompt"
                     onKeyDown={this.handlers.onKeyDown}
                     onInput={this.handleInput}
                     type="text"
                     ref="command"
                     contentEditable="true" />
                {autocomplete}
            </div>
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
    $('html body').animate({ scrollTop: $(document).height() }, 0);
}

function focusLastInput(event) {
    if (_.contains(event.target.classList, 'prompt') || event.metaKey) {
        return;
    }

    var target = _.last(document.getElementsByClassName('prompt'));
    target.focus();
    withCaret(target, () => target.innerText.length);
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

function isCommandKey(event) {
    return _.contains([16, 17, 18], event.keyCode) || event.ctrlKey || event.altKey || event.metaKey;
}

function isDefinedKey(event) {
    return _.some(_.values(keys), matcher => matcher(event));
}

function stopBubblingUp(event) {
    event.stopPropagation();
    event.preventDefault();

    return event;
}

// TODO: Figure out how it works.
function createEventHandler() {
    var subject = function() {
        subject.onNext.apply(subject, arguments);
    };

    getEnumerablePropertyNames(Rx.Subject.prototype)
        .forEach(function (property) {
            subject[property] = Rx.Subject.prototype[property];
        });
    Rx.Subject.call(subject);

    return subject;
}

function getEnumerablePropertyNames(target) {
    var result = [];
    for (var key in target) {
        result.push(key);
    }
    return result;
}

$(document).ready(() => {
    window.terminal = new Terminal(getDimensions());

    $(window).resize(() => terminal.resize(getDimensions()));

    React.render(<Board terminal={window.terminal}/>, document.getElementById('black-board'));

    $(document).keydown(event => focusLastInput(event));
});
