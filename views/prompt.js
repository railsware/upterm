import _ from 'lodash';
import React from 'react';
import Autocomplete from './autocomplete';

export default React.createClass({
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

        //TODO: make it a stream.
        this.props.prompt.getSuggestions(suggestions => this.setState({suggestions: suggestions}) );
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
            !_.contains([9, 13, 27], this.state.latestKeyCode);
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

