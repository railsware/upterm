import * as _ from "lodash";
import * as e from "../Enums";
import * as React from "react";
import AutocompleteComponent from "./AutocompleteComponent";
import DecorationToggleComponent from "./DecorationToggleComponent";
import History from "../History";
import {stopBubblingUp} from "./ViewUtils";
import JobComponent from "./3_JobComponent";
import PromptModel from "../Prompt";
const rx = require("rx");
const reactDOM = require("react-dom");


const keys = {
    goUp: (event: KeyboardEvent) => (event.ctrlKey && event.keyCode === 80) || event.keyCode === 38,
    goDown: (event: KeyboardEvent) => (event.ctrlKey && event.keyCode === 78) || event.keyCode === 40,
    enter: (event: KeyboardEvent) => event.keyCode === 13,
    tab: (event: KeyboardEvent) => event.keyCode === 9,
    deleteWord: (event: KeyboardEvent) => event.ctrlKey && event.keyCode === 87,
    interrupt: (event: KeyboardEvent) => event.ctrlKey && event.keyCode === 67,
};


function setCaretPosition(node: Node, position: number) {
    const selection = window.getSelection();
    const range = document.createRange();

    if (node.childNodes.length) {
        range.setStart(node.childNodes[0], position);
    } else {
        range.setStart(node, 0);
    }
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
}

function getCaretPosition(): number {
    return window.getSelection().anchorOffset;
}

function isCommandKey(event: KeyboardEvent) {
    return _.contains([16, 17, 18], event.keyCode) || event.ctrlKey || event.altKey || event.metaKey;
}

const isDefinedKey = _.memoize(
    (event: React.KeyboardEvent) => _.some(_.values(keys),
                                           (matcher: (event: React.KeyboardEvent) => boolean) => matcher(event)),
    (event: React.KeyboardEvent) => [event.ctrlKey, event.keyCode]
);

// TODO: Figure out how it works.
function createEventHandler(): any {
    const subject: any = function () {
        subject.onNext.apply(subject, arguments);
    };

    function getEnumerablePropertyNames(target: _.Dictionary<any>) {
        const result: string[] = [];
        /* tslint:disable:forin */
        for (let key in target) {
            result.push(key);
        }
        return result;
    }

    getEnumerablePropertyNames(rx.Subject.prototype)
        .forEach(function (property) {
            subject[property] = rx.Subject.prototype[property];
        });
    rx.Subject.call(subject);

    return subject;
}

interface Props {
    status: e.Status;
    jobView: JobComponent;
    prompt: PromptModel;
    hasLocusOfAttention: boolean;
}

interface State {
    caretPosition?: number;
    caretOffset?: Offset;
    highlightedSuggestionIndex?: number;
    latestKeyCode?: number;
    suggestions?: Suggestion[];
}


// TODO: Make sure we only update the view when the model changes.
export default class PromptComponent extends React.Component<Props, State> implements KeyDownReceiver {
    private handlers: {
        onKeyDown: Function;
    };

    constructor(props: Props) {
        super(props);

        const keysDownStream = createEventHandler();
        const promptKeys = keysDownStream.filter(() => this.props.status !== e.Status.InProgress);

        const meaningfulKeysDownStream = promptKeys.filter(isDefinedKey).map(stopBubblingUp);
        const [navigateAutocompleteStream, navigateHistoryStream] = meaningfulKeysDownStream
            .filter((event: KeyboardEvent) => keys.goDown(event) || keys.goUp(event))
            .partition(() => this.isAutocompleteShown());

        keysDownStream.filter(_.negate(isCommandKey))
            .forEach((event: KeyboardEvent) => this.setState({ latestKeyCode: event.keyCode }));

        promptKeys.filter(keys.enter).forEach(() => this.execute());
        promptKeys.filter(keys.interrupt).forEach(() => this.setText(""));

        meaningfulKeysDownStream.filter(() => this.isAutocompleteShown())
            .filter(keys.tab)
            .forEach(() => this.applySuggestion());

        meaningfulKeysDownStream.filter(keys.deleteWord).forEach(() => this.deleteWord());

        navigateHistoryStream.forEach((event: KeyboardEvent) => this.navigateHistory(event));
        navigateAutocompleteStream.forEach((event: KeyboardEvent) => this.navigateAutocomplete(event));

        this.state = {
            suggestions: [],
            highlightedSuggestionIndex: 0,
            latestKeyCode: undefined,
            caretPosition: 0,
            caretOffset: {top: 0, left: 0, bottom: 0},
        };


        this.handlers = {
            onKeyDown: keysDownStream
        };

        // FIXME: find a better design to propagate events.
        if (this.props.hasLocusOfAttention) {
            window.promptUnderAttention = this;
        }
    }

    handleKeyDown(event: KeyboardEvent): void {
        this.commandNode.focus();
    }

    componentDidMount() {
        $(reactDOM.findDOMNode(this)).fixedsticky();
        $(".fixedsticky-dummy").remove();

        this.commandNode.focus();
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        if (this.props.status !== e.Status.NotStarted) {
            return;
        }

        this.commandNode.innerText = this.text;

        if (this.state.caretPosition !== getCaretPosition() || !_.eq(prevState.caretOffset, this.state.caretOffset)) {
            setCaretPosition(this.commandNode, this.state.caretPosition);
        }

        if (prevState.caretPosition !== this.state.caretPosition) {
            this.setState({ caretOffset: $(this.commandNode).caret("offset") });
        }

        if (!prevProps.hasLocusOfAttention && this.props.hasLocusOfAttention) {
            this.commandNode.focus();
        }

        // FIXME: find a better design to propagate events.
        if (this.props.hasLocusOfAttention) {
            window.promptUnderAttention = this;
        }
    }

    render() {
        const classes = ["prompt-wrapper", "fixedsticky", this.props.status].join(" ");

        if (this.showAutocomplete()) {
            var autocomplete = React.createElement(AutocompleteComponent, {
                suggestions: this.state.suggestions,
                caretOffset: this.state.caretOffset,
                onSuggestionHover: this.highlightSuggestion.bind(this),
                onSuggestionClick: this.applySuggestion.bind(this),
                highlightedIndex: this.state.highlightedSuggestionIndex,
                ref: "autocomplete",
            });
        }

        if (this.props.jobView.state.canBeDecorated) {
            var decorationToggle = React.createElement(DecorationToggleComponent, { job: this.props.jobView });
        }

        if (this.props.status !== e.Status.NotStarted) {
            var scrollToTop = React.createElement(
                "a",
                { href: "#", className: "scroll-to-top", onClick: this.handleScrollToTop.bind(this) },
                React.createElement("i", { className: "fa fa-long-arrow-up" })
            );
        }

        return React.createElement(
            "div",
            { className: classes },
            React.createElement(
                "div",
                { className: "prompt-decoration" },
                React.createElement("div", { className: "arrow" })
            ),
            React.createElement("div", { className: "prompt-info", title: this.props.status }),
            React.createElement("div", {
                className: "prompt",
                onKeyDown: this.handlers.onKeyDown.bind(this),
                onInput: this.handleInput.bind(this),
                onKeyPress: this.handleKeyPress.bind(this),
                type: "text",
                ref: "command",
                contentEditable: this.props.status === e.Status.NotStarted || this.props.status === e.Status.InProgress, // Without the InProgress part the alternate buffer loses focus.
            }),
            autocomplete,
            React.createElement(
                "div",
                { className: "actions" },
                decorationToggle,
                scrollToTop
            )
        );
    }

    private execute(): void {
        if (!this.isEmpty()) {
            // Timeout prevents two-line input on cd.
            setTimeout(() => this.props.prompt.execute(), 0);
        }
    }

    private get commandNode(): HTMLInputElement {
        return <any>this.refs["command"];
    }

    private get text(): string {
        return this.props.prompt.value;
    }

    private setText(text: string, position = getCaretPosition()): void {
        this.props.prompt.value = text;
        this.setState({ caretPosition: position });
    }

    private replaceText(text: string): void {
        this.setText(text, text.length);
    }

    private deleteWord(): void {
        // TODO: Remove the word under the caret instead of the last one.
        let newCommand = this.props.prompt.expanded.slice(0, -1).join(" ");

        if (newCommand.length) {
            newCommand += " ";
        }

        this.replaceText(newCommand);
    }

    private isEmpty(): boolean {
        return this.text.replace(/\s/g, "").length === 0;
    }

    private navigateHistory(event: KeyboardEvent): void {
        if (keys.goUp(event)) {
            this.replaceText(History.getPrevious());
        } else {
            this.replaceText(History.getNext());
        }
    }

    private highlightSuggestion(index: number): void {
        this.setState({highlightedSuggestionIndex: index});
    }

    private navigateAutocomplete(event: KeyboardEvent): void {
        if (keys.goUp(event)) {
            var index = Math.max(0, this.state.highlightedSuggestionIndex - 1);
        } else {
            index = Math.min(this.state.suggestions.length - 1, this.state.highlightedSuggestionIndex + 1);
        }

        this.highlightSuggestion(index);
    }

    private applySuggestion(): void {
        var state = this.state;
        const suggestion = state.suggestions[state.highlightedSuggestionIndex];

        if (suggestion.replaceEverything) {
            this.replaceText(suggestion.value);
        } else {
            this.props.prompt.replaceCurrentLexeme(suggestion);
            if (!suggestion.partial) {
                this.props.prompt.value += " ";
            }

            this.setState({ caretPosition: this.text.length });
        }

        this.props.prompt.getSuggestions().then(suggestions =>
            this.setState({ suggestions: suggestions, highlightedSuggestionIndex: 0 })
        );
    }

    private showAutocomplete(): boolean {
        // TODO: use streams.
        return this.props.hasLocusOfAttention &&
            this.state.suggestions.length &&
            this.commandNode && !this.isEmpty() &&
            this.props.status === e.Status.NotStarted && !_.contains([13, 27], this.state.latestKeyCode);
    }

    private isAutocompleteShown(): boolean {
        return !!this.refs["autocomplete"];
    }

    private handleInput(event: React.SyntheticEvent) {
        this.setText((<HTMLElement>event.target).innerText);

        // TODO: remove repetition.
        // TODO: make it a stream.
        this.props.prompt.getSuggestions().then(suggestions =>
            this.setState({ suggestions: suggestions, highlightedSuggestionIndex: 0 })
        );
    }

    private handleScrollToTop(event: Event) {
        stopBubblingUp(event);

        const offset = $(reactDOM.findDOMNode(this.props.jobView)).offset().top - 10;
        $("html, body").animate({ scrollTop: offset }, 300);
    }

    private handleKeyPress(event: Event) {
        if (this.props.status === e.Status.InProgress) {
            stopBubblingUp(event);
        }
    }
}
