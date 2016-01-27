import * as _ from "lodash";
import * as e from "../Enums";
import * as React from "react";
import AutocompleteComponent from "./AutocompleteComponent";
import DecorationToggleComponent from "./DecorationToggleComponent";
import History from "../History";
import {stopBubblingUp} from "./ViewUtils";
import JobComponent from "./3_JobComponent";
import PromptModel from "../Prompt";
import JobModel from "../Job";
import {Suggestion} from "../plugins/autocompletion_providers/Suggestions";
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

/**
 * @note I have no idea how it works. Copied from StackOverflow.
 * @link http://stackoverflow.com/questions/4811822/get-a-ranges-start-and-end-offsets-relative-to-its-parent-container/4812022#4812022
 */
function getCaretPosition(element: any): number {
    let caretOffset = 0;
    let document = element.ownerDocument || element.document;
    let win = document.defaultView || document.parentWindow;
    let selection: any;

    if (typeof win.getSelection !== "undefined") {
        selection = win.getSelection();
        if (selection.rangeCount > 0) {
            let range = win.getSelection().getRangeAt(0);
            let preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(element);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            caretOffset = preCaretRange.toString().length;
        }
    } else {
        selection = document.selection;
        if (selection && selection.type !== "Control") {
            let textRange = selection.createRange();
            let preCaretTextRange = document.body.createTextRange();
            preCaretTextRange.moveToElementText(element);
            preCaretTextRange.setEndPoint("EndToEnd", textRange);
            caretOffset = preCaretTextRange.text.length;
        }
    }
    return caretOffset;
}

function isCommandKey(event: KeyboardEvent) {
    return [16, 17, 18].includes(event.keyCode) || event.ctrlKey || event.altKey || event.metaKey;
}

const isSpecialKey = _.memoize(
    (event: React.KeyboardEvent) => _.some(_.values(keys),
                                           (matcher: (event: React.KeyboardEvent) => boolean) => matcher(event)),
    (event: React.KeyboardEvent) => [event.ctrlKey, event.keyCode]
);

// TODO: Figure out how it works.
function createEventHandler(): any {
    const subject: any = function () {
        subject.onNext.apply(subject, arguments);
    };

    function getEnumerablePropertyNames(target: Dictionary<any>) {
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
    job: JobModel;
    status: e.Status;
    jobView: JobComponent;
    hasLocusOfAttention: boolean;
}

interface State {
    highlightedSuggestionIndex?: number;
    latestKeyCode?: number;
    suggestions?: Suggestion[];
}


// TODO: Make sure we only update the view when the model changes.
export default class PromptComponent extends React.Component<Props, State> implements KeyDownReceiver {
    private prompt: PromptModel;
    private handlers: {
        onKeyDown: Function;
    };

    constructor(props: Props) {
        super(props);
        this.prompt = this.props.job.prompt;

        this.state = {
            suggestions: [],
            highlightedSuggestionIndex: 0,
            latestKeyCode: undefined,
        };

        const allKeys = createEventHandler();
        allKeys
            .filter(_.negate(isCommandKey))
            .forEach((event: KeyboardEvent) => this.setState({ latestKeyCode: event.keyCode }));


        const promptKeys = allKeys.filter(() => this.props.status !== e.Status.InProgress)
                                  .filter(isSpecialKey)
                                  .map(stopBubblingUp);
        promptKeys
            .filter(() => this.isAutocompleteShown())
            .filter(keys.tab)
            .forEach(() => this.applySuggestion());
        promptKeys
            .filter(keys.deleteWord).forEach(() => this.deleteWord());
        promptKeys
            .filter(keys.enter).forEach(() => this.execute());
        promptKeys
            .filter(keys.interrupt).forEach(() => {
                this.prompt.value = "";
                this.setDOMValueProgrammatically("");
            });
        promptKeys
            .filter((event: KeyboardEvent) => keys.goDown(event) || keys.goUp(event))
            .filter(() => this.isAutocompleteShown())
            .forEach((event: KeyboardEvent) => this.navigateAutocomplete(event));
        promptKeys
            .filter((event: KeyboardEvent) => keys.goDown(event) || keys.goUp(event))
            .filter(() => !this.isAutocompleteShown())
            .forEach((event: KeyboardEvent) => this.navigateHistory(event));

        this.handlers = {
            onKeyDown: allKeys
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

        const node = this.commandNode;
        node.focus();
        node.addEventListener("paste", (event: ClipboardEvent) => {
            event.preventDefault();

            const text = event.clipboardData.getData("text/plain");

            if (this.props.status === e.Status.InProgress) {
                this.props.job.write(text);
            } else {
                document.execCommand("insertHTML", false, text);
            }
        });
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        if (this.props.status !== e.Status.NotStarted) {
            return;
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
        let autocomplete: React.ReactElement<any>;
        let decorationToggle: React.ReactElement<any>;
        let scrollToTop: React.ReactElement<any>;

        if (this.showAutocomplete()) {
            autocomplete = React.createElement(AutocompleteComponent, {
                suggestions: this.state.suggestions,
                caretOffset: $(this.commandNode).caret("offset"),
                onSuggestionHover: this.highlightSuggestion.bind(this),
                onSuggestionClick: this.applySuggestion.bind(this),
                highlightedIndex: this.state.highlightedSuggestionIndex,
                ref: "autocomplete",
            });
        }

        if (this.props.jobView.state.canBeDecorated) {
            decorationToggle = React.createElement(DecorationToggleComponent, { job: this.props.jobView });
        }

        if (this.props.status !== e.Status.NotStarted) {
            scrollToTop = React.createElement(
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
                                                                           // Without the InProgress part the alternate buffer loses focus.
                contentEditable: this.props.status === e.Status.NotStarted || this.props.status === e.Status.InProgress,
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
            setTimeout(() => this.prompt.execute(), 0);
        }
    }

    private get commandNode(): HTMLInputElement {
        /* tslint:disable:no-string-literal */
        return <HTMLInputElement>this.refs["command"];
    }

    private setDOMValueProgrammatically(text: string): void {
        this.commandNode.innerText = text;
        setCaretPosition(this.commandNode, text.length);

        this.forceUpdate();
    }

    private deleteWord(current = this.prompt.value, position = getCaretPosition(this.commandNode)): void {
        if (!current.length) {
            return;
        }

        const lastIndex = current.substring(0, position).lastIndexOf(" ");
        const endsWithASpace =  lastIndex === current.length - 1;

        current = current.substring(0, lastIndex);

        if (endsWithASpace) {
            this.deleteWord(current, position);
        } else {
            if (current.length) {
                current += " ";
            }

            this.prompt.value = current + this.prompt.value.substring(getCaretPosition(this.commandNode));
            this.setDOMValueProgrammatically(this.prompt.value);
        }
    }

    private isEmpty(): boolean {
        return this.prompt.value.replace(/\s/g, "").length === 0;
    }

    private navigateHistory(event: KeyboardEvent): void {
        if (keys.goUp(event)) {
            let previous = History.getPrevious();
            this.prompt.value = previous;
            this.setDOMValueProgrammatically(previous);
        } else {
            let next = History.getNext();
            this.prompt.value = next;
            this.setDOMValueProgrammatically(next);
        }
    }

    private highlightSuggestion(index: number): void {
        this.setState({highlightedSuggestionIndex: index});
    }

    private navigateAutocomplete(event: KeyboardEvent): void {
        let index: number;
        if (keys.goUp(event)) {
            index = Math.max(0, this.state.highlightedSuggestionIndex - 1);
        } else {
            index = Math.min(this.state.suggestions.length - 1, this.state.highlightedSuggestionIndex + 1);
        }

        this.highlightSuggestion(index);
    }

    private applySuggestion(): void {
        let state = this.state;
        const suggestion = state.suggestions[state.highlightedSuggestionIndex];

        // FIXME: replace the current lexeme prefix.
        const prefixLength = suggestion.getPrefix(this.props.job).length;
        const caretPosition = getCaretPosition(this.commandNode);
        const valueUpToCaret = this.prompt.value.slice(0, caretPosition);
        const valueFromCaret = this.prompt.value.slice(caretPosition);
        let valueWithoutPrefix = prefixLength ? valueUpToCaret.slice(0, -prefixLength) : valueUpToCaret;

        let newValue = valueWithoutPrefix + suggestion.value;
        if (!suggestion.partial && newValue.slice(-1) !== " " && valueFromCaret[0] !== " ") {
            newValue += " ";
        }


        this.prompt.value = newValue + valueFromCaret;
        this.setDOMValueProgrammatically(this.prompt.value);

        this.prompt.getSuggestions().then(suggestions =>
            this.setState({ suggestions: suggestions, highlightedSuggestionIndex: 0 })
        );
    }

    private showAutocomplete(): boolean {
        // TODO: use streams.
        return this.props.hasLocusOfAttention &&
            this.state.suggestions.length &&
            this.commandNode && !this.isEmpty() &&
            this.props.status === e.Status.NotStarted && ![13, 27].includes(this.state.latestKeyCode);
    }

    private isAutocompleteShown(): boolean {
        /* tslint:disable:no-string-literal */
        return !!this.refs["autocomplete"];
    }

    private handleInput(event: React.SyntheticEvent) {
        this.prompt.value = (<HTMLElement>event.target).innerText;

        // TODO: remove repetition.
        // TODO: make it a stream.
        this.prompt.getSuggestions().then(suggestions =>
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
