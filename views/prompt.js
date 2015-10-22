import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import Autocomplete from './autocomplete';
import DecorationToggle from './decoration_toggle';
import History from '../src/History';

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
    componentWillMount() {
        var keysDownStream = createEventHandler();
        var [inProgressKeys, promptKeys] = keysDownStream.partition(_ => this.props.status === 'in-progress');

        inProgressKeys
            .filter(_.negate(isMetaKey))
            .filter(_.negate(isShellHandledKey))
            .map(stopBubblingUp)
            .forEach(event => this.props.invocation.write(event));

        var meaningfulKeysDownStream = promptKeys.filter(isDefinedKey).map(stopBubblingUp);
        var [navigateAutocompleteStream, navigateHistoryStream] = meaningfulKeysDownStream
            .filter(event => keys.goDown(event) || keys.goUp(event))
            .partition(this.autocompleteIsShown);

        keysDownStream.filter(_.negate(isCommandKey))
            .forEach(event => this.setState({latestKeyCode: event.keyCode}));

        promptKeys.filter(keys.enter).forEach(this.execute);

        meaningfulKeysDownStream.filter(this.autocompleteIsShown)
            .filter(keys.tab)
            .forEach(this.selectAutocomplete);

        meaningfulKeysDownStream.filter(keys.deleteWord).forEach(this.deleteWord);
        inProgressKeys.filter(keys.interrupt).forEach(() => this.props.invocation.interrupt());

        navigateHistoryStream.forEach(this.navigateHistory);
        navigateAutocompleteStream.forEach(this.navigateAutocomplete);

        this.handlers = {
            onKeyDown: keysDownStream
        };
    },
    componentDidMount() {

        $(ReactDOM.findDOMNode(this)).fixedsticky();
        $('.fixedsticky-dummy').remove();

        this.refs.command.focus();
    },
    componentDidUpdate(prevProps, prevState) {
        if (this.props.status !== 'not-started') {
            return;
        }

        var newCaretPosition = getCaretPosition();
        this.refs.command.innerText = this.getText();

        if (this.state.caretPosition !== newCaretPosition || prevState.caretOffset !== this.state.caretOffset) {
            this.state.caretPosition = newCaretPosition;
            setCaretPosition(this.refs.command, this.state.caretPosition);
        }

        if (prevState.caretPosition !== this.state.caretPosition) {
            this.setState({caretOffset: $(this.refs.command).caret('offset')});
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
    replaceText(text) {
        this.setText(text, text.length);
    },
    setText(text, position = getCaretPosition()) {
        this.props.invocation.setPromptText(text);
        this.setState({caretPosition: position});
    },
    isEmpty() {
        return this.getText().replace(/\s/g, '').length === 0;
    },
    navigateHistory(event) {
        if (keys.goUp(event)) {
            this.replaceText(History.getPrevious());
        } else {
            this.replaceText(History.getNext());
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
        const suggestion = state.suggestions[state.selectedAutocompleteIndex];

        if (suggestion.replaceAll) {
            this.replaceText(suggestion.value)
        } else {
            this.props.prompt.replaceCurrentLexeme(suggestion);
            if (!suggestion.partial) {
                this.props.prompt.buffer.write(' ');
            }

            this.setState({caretPosition: this.getText().length});
        }

        this.props.prompt.getSuggestions().then(suggestions =>
            this.setState({suggestions: suggestions, selectedAutocompleteIndex: 0})
        );
    },
    deleteWord() {
        // TODO: Remove the word under the caret instead of the last one.
        var newCommand = this.props.prompt.expanded.slice(0, -1).join(' ');

        if (newCommand.length) {
            newCommand += ' ';
        }

        this.replaceText(newCommand);
    },
    handleInput(event) {
        this.setText(event.target.innerText);

        //TODO: remove repetition.
        //TODO: make it a stream.
        this.props.prompt.getSuggestions().then(suggestions =>
            this.setState({suggestions: suggestions, selectedAutocompleteIndex: 0})
        );
    },
    handleScrollToTop(event) {
        stopBubblingUp(event);

        const offset = $(this.props.invocationView.getDOMNode()).offset().top - 10;
        $('html, body').animate({ scrollTop: offset }, 300);
    },
    handleKeyPress(event) {
        if (this.props.status === 'in-progress') {
            stopBubblingUp(event);
        }
    },
    showAutocomplete() {
        //TODO: use streams.
        return this.refs.command &&
            this.state.suggestions.length &&
            this.props.status === 'not-started' && !_.contains([13, 27], this.state.latestKeyCode);
    },
    autocompleteIsShown() {
        return this.refs.autocomplete;
    },
    render() {
        var classes = ['prompt-wrapper', 'fixedsticky', this.props.status].join(' ');

        if (this.showAutocomplete()) {
            var autocomplete = <Autocomplete suggestions={this.state.suggestions}
                                             caretOffset={this.state.caretOffset}
                                             selectedIndex={this.state.selectedAutocompleteIndex}
                                             ref="autocomplete"/>;
        }


        if (this.props.invocationView.state.canBeDecorated) {
            var decorationToggle = <DecorationToggle invocation={this.props.invocationView}/>;
        }

        if (this.props.invocation.hasOutput()) {
            var scrollToTop = <a href="#" className="scroll-to-top" onClick={this.handleScrollToTop}>
                <i className="fa fa-long-arrow-up"></i>
            </a>;
        }

        return (
            <div className={classes}>
                <div className="prompt-decoration">
                    <div className="arrow"></div>
                </div>
                <div className="prompt-info" title={this.props.status}></div>
                <div className="prompt"
                     onKeyDown={this.handlers.onKeyDown}
                     onInput={this.handleInput}
                     onKeyPress={this.handleKeyPress}
                     type="text"
                     ref="command"
                     contentEditable="true"></div>
                {autocomplete}
                <div className="actions">
                    {decorationToggle}
                    {scrollToTop}
                </div>
            </div>
        )
    }
});

