import * as _ from 'lodash';
import * as e from '../Enums';
import * as React from 'react';
import AutocompleteComponent from './AutocompleteComponent';
import DecorationToggleComponent from './DecorationToggleComponent';
import History from '../History';
import {stopBubblingUp, scrollToBottom} from './ViewUtils';
import Invocation from "../Invocation";
import {Suggestion} from "../Interfaces";
import InvocationComponent from "./InvocationComponent";
import PromptModel from "../Prompt";
import KeyboardEvent = __React.KeyboardEvent;
const Rx = require('rx');
const ReactDOM = require("react-dom");


var keys = {
    goUp: (event: KeyboardEvent) => (event.ctrlKey && event.keyCode === 80) || event.keyCode === 38,
    goDown: (event: KeyboardEvent) => (event.ctrlKey && event.keyCode === 78) || event.keyCode === 40,
    enter: (event: KeyboardEvent) => event.keyCode === 13,
    tab: (event: KeyboardEvent) => event.keyCode === 9,
    deleteWord: (event: KeyboardEvent) => event.ctrlKey && event.keyCode === 87,
    interrupt: (event: KeyboardEvent) => event.ctrlKey && event.keyCode === 67
};


function setCaretPosition(node: Node, position: number) {
    var selection = window.getSelection();
    var range = document.createRange();

    if (node.childNodes.length) {
        range.setStart(node.childNodes[0], position);
    } else {
        range.setStart(node, 0);
    }
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
}

function getCaretPosition():number {
    return window.getSelection().anchorOffset;
}

function isCommandKey(event: KeyboardEvent) {
    return _.contains([16, 17, 18], event.keyCode) || event.ctrlKey || event.altKey || event.metaKey;
}

export function isMetaKey(event: KeyboardEvent) {
    return event.metaKey || _.some([event.key, event.keyIdentifier],
            key => _.includes(['Shift', 'Alt', 'Ctrl'], key));
}

function isShellHandledKey(event: KeyboardEvent) {
    return keys.interrupt(event);
}

const isDefinedKey = _.memoize((event: React.KeyboardEvent) => _.some(_.values(keys), (matcher: (event: React.KeyboardEvent) => boolean) => matcher(event)),
    (event: React.KeyboardEvent) => [event.ctrlKey, event.keyCode]);

// TODO: Figure out how it works.
function createEventHandler():any {
    var subject:any = function () {
        subject.onNext.apply(subject, arguments);
    };

    function getEnumerablePropertyNames(target: _.Dictionary<any>) {
        var result: string[] = [];
        for (var key in target) {
            result.push(key);
        }
        return result;
    }

    getEnumerablePropertyNames(Rx.Subject.prototype)
        .forEach(function (property) {
            subject[property] = Rx.Subject.prototype[property];
        });
    Rx.Subject.call(subject);

    return subject;
}

interface Props {
    status: e.Status;
    invocation: Invocation;
    invocationView: InvocationComponent;
    prompt: PromptModel;
}

interface State {
    caretPosition?: number;
    caretOffset?: number;
    highlightedSuggestionIndex?: number;
    latestKeyCode?: number;
    suggestions?: Suggestion[]
}


// TODO: Make sure we only update the view when the model changes.
export default class PromptComponent extends React.Component<Props, State> {
    private handlers:{
        onKeyDown: Function;
    };

    constructor(props: Props) {
        super(props);
        var keysDownStream = createEventHandler();
        var [inProgressKeys, promptKeys] = keysDownStream.partition(() => this.props.status === e.Status.InProgress);

        inProgressKeys
            .filter(_.negate(isMetaKey))
            .filter(_.negate(isShellHandledKey))
            .map(stopBubblingUp)
            .forEach((event: React.KeyboardEvent) => this.props.invocation.write(event));

        var meaningfulKeysDownStream = promptKeys.filter(isDefinedKey).map(stopBubblingUp);
        var [navigateAutocompleteStream, navigateHistoryStream] = meaningfulKeysDownStream
            .filter((event: KeyboardEvent) => keys.goDown(event) || keys.goUp(event))
            .partition(() => this.autocompleteIsShown());

        keysDownStream.filter(_.negate(isCommandKey))
            .forEach((event: KeyboardEvent) => this.setState({latestKeyCode: event.keyCode}));

        promptKeys.filter(keys.enter).forEach(() => this.execute());

        meaningfulKeysDownStream.filter(() => this.autocompleteIsShown())
            .filter(keys.tab)
            .forEach(() => this.selectAutocomplete());

        meaningfulKeysDownStream.filter(keys.deleteWord).forEach(() => this.deleteWord());
        inProgressKeys.filter(keys.interrupt).forEach(() => this.props.invocation.interrupt());

        navigateHistoryStream.forEach((event: KeyboardEvent) => this.navigateHistory(event));
        navigateAutocompleteStream.forEach((event: KeyboardEvent) => this.navigateAutocomplete(event));

        this.state = {
            suggestions: [],
            highlightedSuggestionIndex: 0,
            latestKeyCode: null,
            caretPosition: 0,
            caretOffset: 0
        };


        this.handlers = {
            onKeyDown: keysDownStream
        };
    }

    componentDidMount() {

        $(ReactDOM.findDOMNode(this)).fixedsticky();
        $('.fixedsticky-dummy').remove();

        this.commandNode.focus();
    }

    private get commandNode():HTMLInputElement {
        return <any>this.refs['command'];
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        if (this.props.status !== e.Status.NotStarted) {
            return;
        }

        this.commandNode.innerText = this.getText();

        if (this.state.caretPosition !== getCaretPosition() || prevState.caretOffset !== this.state.caretOffset) {
            setCaretPosition(this.commandNode, this.state.caretPosition);
        }

        if (prevState.caretPosition !== this.state.caretPosition) {
            this.setState({caretOffset: $(this.commandNode).caret('offset')});
        }

        scrollToBottom();

    }

    execute() {
        if (!this.isEmpty()) {
            // Timeout prevents two-line input on cd.
            setTimeout(() => this.props.prompt.execute(), 0);
        }
    }

    getText() {
        return this.props.prompt.buffer.toString();
    }

    replaceText(text: string) {
        this.setText(text, text.length);
    }

    setText(text: string, position = getCaretPosition()) {
        this.props.invocation.setPromptText(text);
        this.setState({caretPosition: position});
    }

    isEmpty() {
        return this.getText().replace(/\s/g, '').length === 0;
    }

    navigateHistory(event: KeyboardEvent) {
        if (keys.goUp(event)) {
            this.replaceText(History.getPrevious());
        } else {
            this.replaceText(History.getNext());
        }
    }

    navigateAutocomplete(event: KeyboardEvent) {
        if (keys.goUp(event)) {
            var index = Math.max(0, this.state.highlightedSuggestionIndex - 1)
        } else {
            index = Math.min(this.state.suggestions.length - 1, this.state.highlightedSuggestionIndex + 1)
        }

        this.setState({highlightedSuggestionIndex: index});
    }

    selectAutocomplete() {
        var state = this.state;
        const suggestion = state.suggestions[state.highlightedSuggestionIndex];

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
            this.setState({suggestions: suggestions, highlightedSuggestionIndex: 0})
        );
    }

    deleteWord() {
        // TODO: Remove the word under the caret instead of the last one.
        var newCommand = this.props.prompt.expanded.slice(0, -1).join(' ');

        if (newCommand.length) {
            newCommand += ' ';
        }

        this.replaceText(newCommand);
    }

    handleInput(event: React.SyntheticEvent) {
        this.setText((<HTMLElement>event.target).innerText);

        //TODO: remove repetition.
        //TODO: make it a stream.
        this.props.prompt.getSuggestions().then(suggestions =>
            this.setState({suggestions: suggestions, highlightedSuggestionIndex: 0})
        );
    }

    handleScrollToTop(event: Event) {
        stopBubblingUp(event);

        const offset = $(ReactDOM.findDOMNode(this.props.invocationView)).offset().top - 10;
        $('html, body').animate({scrollTop: offset}, 300);
    }

    handleKeyPress(event: Event) {
        if (this.props.status === e.Status.InProgress) {
            stopBubblingUp(event);
        }
    }

    showAutocomplete() {
        //TODO: use streams.
        return this.commandNode &&
            this.state.suggestions.length &&
            this.props.status === e.Status.NotStarted && !_.contains([13, 27], this.state.latestKeyCode);
    }

    autocompleteIsShown():boolean {
        return !!this.refs['autocomplete'];
    }

    render() {
        var classes = ['prompt-wrapper', 'fixedsticky', this.props.status].join(' ');

        if (this.showAutocomplete()) {
            var autocomplete = React.createElement(AutocompleteComponent, {
                suggestions: this.state.suggestions,
                caretOffset: this.state.caretOffset,
                highlightedIndex: this.state.highlightedSuggestionIndex,
                ref: 'autocomplete'
            });
        }

        if (this.props.invocationView.state.canBeDecorated) {
            var decorationToggle = React.createElement(DecorationToggleComponent, {invocation: this.props.invocationView});
        }

        if (this.props.invocation.hasOutput()) {
            var scrollToTop = React.createElement(
                'a',
                {href: '#', className: 'scroll-to-top', onClick: this.handleScrollToTop.bind(this)},
                React.createElement('i', {className: 'fa fa-long-arrow-up'})
            );
        }

        return React.createElement(
            'div',
            {className: classes},
            React.createElement(
                'div',
                {className: 'prompt-decoration'},
                React.createElement('div', {className: 'arrow'})
            ),
            React.createElement('div', {className: 'prompt-info', title: this.props.status}),
            React.createElement('div', {
                className: 'prompt',
                onKeyDown: this.handlers.onKeyDown.bind(this),
                onInput: this.handleInput.bind(this),
                onKeyPress: this.handleKeyPress.bind(this),
                type: 'text',
                ref: 'command',
                contentEditable: 'true'
            }),
            autocomplete,
            React.createElement(
                'div',
                {className: 'actions'},
                decorationToggle,
                scrollToTop
            )
        );
    }
}
