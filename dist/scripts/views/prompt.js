'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _autocomplete = require('./autocomplete');

var _autocomplete2 = _interopRequireDefault(_autocomplete);

var _decoration_toggle = require('./decoration_toggle');

var _decoration_toggle2 = _interopRequireDefault(_decoration_toggle);

// TODO: Make sure we only update the view when the model changes.
exports['default'] = _react2['default'].createClass({
    displayName: 'prompt',

    getInitialState: function getInitialState() {
        return {
            suggestions: [],
            selectedAutocompleteIndex: 0,
            latestKeyCode: null,
            caretPosition: 0,
            caretOffset: 0
        };
    },
    getInputNode: function getInputNode() {
        // TODO: Try to cache.
        return this.refs.command.getDOMNode();
    },
    componentWillMount: function componentWillMount() {
        var _this = this;

        var keysDownStream = createEventHandler();

        var _keysDownStream$partition = keysDownStream.partition(function (_) {
            return _this.props.status === 'in-progress';
        });

        var _keysDownStream$partition2 = _slicedToArray(_keysDownStream$partition, 2);

        var passThroughKeys = _keysDownStream$partition2[0];
        var promptKeys = _keysDownStream$partition2[1];

        passThroughKeys.filter(_lodash2['default'].negate(isMetaKey)).map(stopBubblingUp).forEach(function (event) {
            return _this.props.invocation.write(event);
        });

        var meaningfulKeysDownStream = promptKeys.filter(isDefinedKey).map(stopBubblingUp);

        var _meaningfulKeysDownStream$filter$partition = meaningfulKeysDownStream.filter(function (event) {
            return keys.goDown(event) || keys.goUp(event);
        }).partition(this.autocompleteIsShown);

        var _meaningfulKeysDownStream$filter$partition2 = _slicedToArray(_meaningfulKeysDownStream$filter$partition, 2);

        var navigateAutocompleteStream = _meaningfulKeysDownStream$filter$partition2[0];
        var navigateHistoryStream = _meaningfulKeysDownStream$filter$partition2[1];

        keysDownStream.filter(_lodash2['default'].negate(isCommandKey)).forEach(function (event) {
            return _this.setState({ latestKeyCode: event.keyCode });
        });

        promptKeys.filter(keys.enter).forEach(this.execute);

        meaningfulKeysDownStream.filter(this.autocompleteIsShown).filter(keys.tab).forEach(this.selectAutocomplete);

        meaningfulKeysDownStream.filter(keys.deleteWord).forEach(this.deleteWord);

        navigateHistoryStream.forEach(this.navigateHistory);
        navigateAutocompleteStream.forEach(this.navigateAutocomplete);

        this.handlers = {
            onKeyDown: keysDownStream
        };
    },
    componentDidMount: function componentDidMount() {
        $(this.getDOMNode()).fixedsticky();
        $('.fixedsticky-dummy').remove();

        this.getInputNode().focus();
    },
    componentDidUpdate: function componentDidUpdate(prevProps, prevState) {
        var inputNode = this.getInputNode();
        inputNode.innerText = this.getText();

        if (prevState.caretPosition !== this.state.caretPosition || prevState.caretOffset !== this.state.caretOffset) {
            setCaretPosition(inputNode, this.state.caretPosition);
        }

        if (prevState.caretPosition !== this.state.caretPosition) {
            this.setState({ caretOffset: $(inputNode).caret('offset') });
        }

        scrollToBottom();
    },
    execute: function execute() {
        var _this2 = this;

        if (!this.isEmpty()) {
            // Timeout prevents two-line input on cd.
            setTimeout(function () {
                return _this2.props.prompt.execute();
            }, 0);
        }
    },
    getText: function getText() {
        return this.props.prompt.buffer.toString();
    },
    setText: function setText(text) {
        this.props.invocation.setPromptText(text);
        this.setState({ caretPosition: this.props.prompt.buffer.cursor.column() });
    },
    isEmpty: function isEmpty() {
        return this.getText().replace(/\s/g, '').length === 0;
    },
    navigateHistory: function navigateHistory(event) {
        if (keys.goUp(event)) {
            var prevCommand = this.props.prompt.history.getPrevious();

            if (typeof prevCommand !== 'undefined') {
                this.setText(prevCommand);
            }
        } else {
            this.setText(this.props.prompt.history.getNext() || '');
        }
    },
    navigateAutocomplete: function navigateAutocomplete(event) {
        if (keys.goUp(event)) {
            var index = Math.max(0, this.state.selectedAutocompleteIndex - 1);
        } else {
            index = Math.min(this.state.suggestions.length - 1, this.state.selectedAutocompleteIndex + 1);
        }

        this.setState({ selectedAutocompleteIndex: index });
    },
    selectAutocomplete: function selectAutocomplete() {
        var _this3 = this;

        var state = this.state;
        var suggestion = state.suggestions[state.selectedAutocompleteIndex];
        this.props.prompt.replaceCurrentLexeme(suggestion);

        if (!suggestion.partial) {
            this.props.prompt.buffer.write(' ');
        }

        this.props.prompt.getSuggestions().then(function (suggestions) {
            _this3.setState({
                suggestions: suggestions,
                selectedAutocompleteIndex: 0,
                caretPosition: _this3.props.prompt.buffer.cursor.column()
            });
        });
    },
    deleteWord: function deleteWord() {
        // TODO: Remove the word under the caret instead of the last one.
        var newCommand = this.props.prompt.getWholeCommand().slice(0, -1).join(' ');

        if (newCommand.length) {
            newCommand += ' ';
        }

        this.setText(newCommand);
    },
    handleInput: function handleInput(event) {
        var _this4 = this;

        this.setText(event.target.innerText);

        //TODO: make it a stream.
        this.props.prompt.getSuggestions().then(function (suggestions) {
            return _this4.setState({
                suggestions: suggestions,
                selectedAutocompleteIndex: 0,
                caretPosition: _this4.props.prompt.buffer.cursor.column()
            });
        });
    },
    handleScrollToTop: function handleScrollToTop(event) {
        stopBubblingUp(event);

        var offset = $(this.props.invocationView.getDOMNode()).offset().top - 10;
        $('html, body').animate({ scrollTop: offset }, 300);
    },
    handleKeyPress: function handleKeyPress(event) {
        if (this.props.status === 'in-progress') {
            stopBubblingUp(event);
        }
    },
    showAutocomplete: function showAutocomplete() {
        //TODO: use streams.
        return this.refs.command && this.state.suggestions.length && this.props.status === 'not-started' && !_lodash2['default'].contains([13, 27], this.state.latestKeyCode);
    },
    autocompleteIsShown: function autocompleteIsShown() {
        return this.refs.autocomplete;
    },
    render: function render() {
        var classes = ['prompt-wrapper', 'fixedsticky', this.props.status].join(' ');

        if (this.showAutocomplete()) {
            var autocomplete = _react2['default'].createElement(_autocomplete2['default'], { suggestions: this.state.suggestions,
                caretOffset: this.state.caretOffset,
                selectedIndex: this.state.selectedAutocompleteIndex,
                ref: 'autocomplete' });
        }

        if (this.props.invocationView.state.canBeDecorated) {
            var decorationToggle = _react2['default'].createElement(_decoration_toggle2['default'], { invocation: this.props.invocationView });
        }

        if (this.props.invocation.hasOutput()) {
            var scrollToTop = _react2['default'].createElement(
                'a',
                { href: '#', className: 'scroll-to-top', onClick: this.handleScrollToTop },
                _react2['default'].createElement('i', { className: 'fa fa-long-arrow-up' })
            );
        }

        return _react2['default'].createElement(
            'div',
            { className: classes },
            _react2['default'].createElement(
                'div',
                { className: 'prompt-decoration' },
                _react2['default'].createElement('div', { className: 'arrow' })
            ),
            _react2['default'].createElement('div', { className: 'prompt',
                onKeyDown: this.handlers.onKeyDown,
                onInput: this.handleInput,
                onKeyPress: this.handleKeyPress,
                type: 'text',
                ref: 'command',
                contentEditable: 'true' }),
            autocomplete,
            _react2['default'].createElement(
                'div',
                { className: 'actions' },
                decorationToggle,
                scrollToTop
            )
        );
    }
});
module.exports = exports['default'];