import _ from 'lodash';
import React from 'react';
import Autocomplete from './autocomplete';

// TODO: Make sure we only update the view when the model changes.
export default React.createClass({
    getInitialState() {
        return {
            suggestions: [],
            selectedAutocompleteIndex: 0,
            latestKeyCode: null,
            caretPosition: 0,
            caretOffset: 0
        }
    },
    getInputNode() {
        // TODO: Try to cache.
        return this.refs.command.getDOMNode()
    },
    getCaretPixelOffset() {
        return $(this.getInputNode()).caret('offset');
    },
    componentWillMount() {
        var keysDownStream = createEventHandler();
        var promptKeys = keysDownStream.filter(_ => this.props.status != 'in-progress');

        // TODO: move to invocation.
        keysDownStream
            .filter(_ => this.props.status == 'in-progress')
            .map(stopBubblingUp)
            .forEach(event => {
                this.props.invocation.write(event);
            });

        var meaningfulKeysDownStream = promptKeys.filter(isDefinedKey).map(stopBubblingUp);
        var [navigateAutocompleteStream, navigateHistoryStream] = meaningfulKeysDownStream
            .filter(event => keys.goDown(event) || keys.goUp(event))
            .partition(this.autocompleteIsShown);

        keysDownStream.filter(_.negate(isCommandKey))
            .forEach(event => this.setState({latestKeyCode: event.keyCode}));

        meaningfulKeysDownStream.filter(keys.enter)
            .filter(_ => this.props.status != 'in-progress')
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
    componentDidUpdate(prevProps, prevState) {
        this.getInputNode().innerText = this.getText();
        if (prevState.caretPosition != this.state.caretPosition) {
            setCaretPosition(this.getInputNode(), this.state.caretPosition);
        }

        scrollToBottom();
    },
    execute() {
        if (!this.isEmpty()) {
            // Timeout prevents two-line input on cd.
            setTimeout(() => this.props.prompt.execute(), 0);
        }
    },
    getText() {
        return this.props.prompt.buffer.toString();
    },
    setText(text) {
        this.props.prompt.buffer.setTo(text);
        this.setState({caretPosition: this.props.prompt.buffer.cursor.column()});
    },
    isEmpty() {
        return this.getText().replace(/\s/g, '').length == 0;
    },
    navigateHistory(event) {
        if (keys.goUp(event)) {
            var prevCommand = this.props.prompt.history.getPrevious();

            if (typeof prevCommand != 'undefined') {
                this.setText(prevCommand);
            }
        } else {
            this.setText(this.props.prompt.history.getNext() || '');
        }
    },
    navigateAutocomplete(event) {
        if (keys.goUp(event)) {
            var index = Math.max(0, this.state.selectedAutocompleteIndex - 1)
        } else {
            index = Math.min(this.state.suggestions.length - 1, this.state.selectedAutocompleteIndex + 1)
        }

        this.setState({selectedAutocompleteIndex: index});
    },
    selectAutocomplete() {
        var state = this.state;
        this.props.prompt.replaceCurrentLexeme(state.suggestions[state.selectedAutocompleteIndex]);
        this.props.prompt.buffer.write(' ');

        this.setState({caretPosition: this.props.prompt.buffer.cursor.column()});
    },
    handleInput(event) {
        var target = event.target;
        var caretOffset = this.getCaretPixelOffset();
        var caretPosition = window.getSelection().baseOffset;
        this.props.prompt.buffer.setTo(target.innerText);
        this.props.prompt.buffer.cursor.moveAbsolute({vertical: caretPosition});

        //TODO: make it a stream.
        this.props.prompt.getSuggestions().then(suggestions =>
                this.setState({
                    suggestions: suggestions,
                    selectedAutocompleteIndex: 0,
                    caretPosition: this.props.prompt.buffer.cursor.column(),
                    caretOffset: caretOffset
                })
        );
    },
    currentToken() {
        // TODO: return the token under cursor.
        return this.getText().split(/\s+/).pop();
    },
    showAutocomplete() {
        //TODO: use streams.
        return this.refs.command &&
            this.state.suggestions.length &&
            this.currentToken().length &&
            this.props.status == 'not-started' && !_.contains([9, 13, 27], this.state.latestKeyCode);
    },
    autocompleteIsShown() {
        return this.refs.autocomplete;
    },
    render() {
        var classes = ['prompt-wrapper', this.props.status].join(' ');

        if (this.showAutocomplete()) {
            var autocomplete = <Autocomplete suggestions={this.state.suggestions}
                                             caretOffset={this.state.caretOffset}
                                             selectedIndex={this.state.selectedAutocompleteIndex}
                                             ref="autocomplete"/>;
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
                     contentEditable="true"/>
                {autocomplete}
            </div>
        )
    }
});

