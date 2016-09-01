import * as _ from "lodash";
import * as e from "../Enums";
import * as React from "react";
import {AutocompleteComponent} from "./AutocompleteComponent";
import {DecorationToggleComponent} from "./DecorationToggleComponent";
import {History} from "../shell/History";
import {stopBubblingUp, getCaretPosition, setCaretPosition} from "./ViewUtils";
import {Prompt} from "../shell/Prompt";
import {Job} from "../shell/Job";
import {Suggestion} from "../plugins/autocompletion_utils/Common";
import {KeyCode} from "../Enums";
import {getSuggestions} from "../Autocompletion";
import * as css from "./css/main";
import {fontAwesome} from "./css/FontAwesome";
import {Status} from "../Enums";
import {scan} from "../shell/Scanner";
import {assign} from "../utils/Common";

interface Props {
    job: Job;
    status: e.Status;
    decorateToggler: () => boolean;
    isFocused: boolean;
}

interface State {
    highlightedSuggestionIndex: number;
    previousKeyCode: number;
    offsetTop: number;
    caretPositionFromPreviousFocus: number;
    suggestions: Suggestion[];
    isSticky: boolean;
}


// TODO: Make sure we only update the view when the model changes.
export class PromptComponent extends React.Component<Props, State> {
    private prompt: Prompt;

    private intersectionObserver = new IntersectionObserver(
        (entries) => {
            const entry = entries[0];
            const nearTop = entry.boundingClientRect.top < 50;
            const isVisible = entry.intersectionRatio === 1;

            this.setState(assign(this.state, {isSticky: nearTop && !isVisible}));
        },
        {
            threshold: 1,
            rootMargin: css.toDOMString(css.promptWrapperHeight),
        }
    );

    /* tslint:disable:member-ordering */
    constructor(props: Props) {
        super(props);
        this.prompt = this.props.job.prompt;

        this.state = {
            highlightedSuggestionIndex: 0,
            previousKeyCode: KeyCode.Escape,
            offsetTop: 0,
            caretPositionFromPreviousFocus: 0,
            suggestions: [],
            isSticky: false,
        };

        // FIXME: find a better design to propagate events.
        if (this.props.isFocused) {
            window.focusedPrompt = this;
        }
    }

    componentDidMount() {
        this.focus();
        this.setDOMValueProgrammatically(this.prompt.value);

        this.intersectionObserver.observe(this.placeholderNode);
    }

    componentWillUnmount() {
        this.intersectionObserver.unobserve(this.placeholderNode);
        this.intersectionObserver.disconnect();
    }

    componentDidUpdate(prevProps: Props) {
        if (this.props.status !== e.Status.NotStarted) {
            return;
        }

        if (!prevProps.isFocused && this.props.isFocused) {
            this.focus();
        }

        // FIXME: find a better design to propagate events.
        if (this.props.isFocused) {
            window.focusedPrompt = this;
        }
    }

    render() {
        // FIXME: write better types.
        let autocomplete: any;
        let autocompletedPreview: any;
        let decorationToggle: any;
        let scrollToTop: any;

        if (this.showAutocomplete()) {
            autocomplete = <AutocompleteComponent suggestions={this.state.suggestions}
                                                  offsetTop={this.state.offsetTop}
                                                  caretPosition={getCaretPosition(this.commandNode)}
                                                  onSuggestionHover={index => this.setState(assign(this.state, {highlightedSuggestionIndex: index}))}
                                                  onSuggestionClick={this.applySuggestion.bind(this)}
                                                  highlightedIndex={this.state.highlightedSuggestionIndex}
                                                  ref="autocomplete"/>;
            const completed = this.valueWithCurrentSuggestion;
            if (completed.trim() !== this.prompt.value && completed.startsWith(this.prompt.value)) {
                autocompletedPreview = <div style={css.autocompletedPreview}>{completed}</div>;
            }
        }

        if (this.props.job.canBeDecorated()) {
            decorationToggle = <DecorationToggleComponent decorateToggler={this.props.decorateToggler}/>;
        }

        if (this.state.isSticky) {
            scrollToTop = <span style={css.action}
                                title="Scroll to beginning of output."
                                onClick={this.handleScrollToTop.bind(this)}
                                dangerouslySetInnerHTML={{__html: fontAwesome.longArrowUp}}/>;
        }

        return (
            <div className="prompt-placeholder" ref="placeholder" id={this.props.job.id.toString()} style={css.promptPlaceholder}>
                <div className="prompt-wrapper" style={css.promptWrapper(this.props.status, this.state.isSticky)}>
                    <div style={css.arrow(this.props.status)}>
                        <div style={css.arrowInner(this.props.status)}></div>
                    </div>
                    <div style={css.promptInfo(this.props.status)}
                         title={JSON.stringify(this.props.status)}
                         dangerouslySetInnerHTML={{__html: this.props.status === Status.Interrupted ? fontAwesome.close : ""}}></div>
                    <div className="prompt"
                         style={css.prompt(this.state.isSticky)}
                         onInput={this.handleInput.bind(this)}
                         onDrop={this.handleDrop.bind(this)}
                         onBlur={() => this.setState(assign(this.state, {caretPositionFromPreviousFocus: getCaretPosition(this.commandNode)}))}
                         onFocus={() => setCaretPosition(this.commandNode, this.state.caretPositionFromPreviousFocus)}
                         type="text"
                         ref="command"
                         contentEditable={this.props.status === e.Status.NotStarted}></div>
                    {autocompletedPreview}
                    {autocomplete}
                    <div style={css.actions}>
                        {decorationToggle}
                        {scrollToTop}
                    </div>
                </div>
            </div>
        );
    }

    focus(): void {
        this.commandNode.focus();
    }

    clear(): void {
        this.setText("");
    }

    setPreviousKeyCode(event: KeyboardEvent) {
        this.setState(assign(this.state, {
            previousKeyCode: event.keyCode,
            offsetTop: (event.target as HTMLDivElement).getBoundingClientRect().top}
        ));
    }

    async appendLastLArgumentOfPreviousCommand(): Promise<void> {
        this.setText(this.prompt.value + _.last(scan(History.latest)).value);
    }

    async execute(promptText: string): Promise<void> {
        this.prompt.setValue(promptText);

        if (!this.isEmpty()) {
            this.props.job.execute();
        }
    }

    async deleteWord(current = this.prompt.value, position = getCaretPosition(this.commandNode)): Promise<void> {
        if (!current.length) {
            return;
        }

        const lastIndex = current.substring(0, position).lastIndexOf(" ");
        const endsWithASpace = lastIndex === current.length - 1;

        current = current.substring(0, lastIndex);

        if (endsWithASpace) {
            this.deleteWord(current, position);
        } else {
            if (current.length) {
                current += " ";
            }

            this.prompt.setValue(current + this.prompt.value.substring(getCaretPosition(this.commandNode)));
            this.setDOMValueProgrammatically(this.prompt.value);
        }
    }

    setPreviousHistoryItem(): void {
        this.setText(History.getPrevious());
    }

    setNextHistoryItem(): void {
        this.setText(History.getNext());
    }

    focusPreviousSuggestion(): void {
        const index = Math.max(0, this.state.highlightedSuggestionIndex - 1);
        this.setState(assign(this.state, {highlightedSuggestionIndex: index}));
    }

    focusNextSuggestion(): void {
        const index = Math.min(this.state.suggestions.length - 1, this.state.highlightedSuggestionIndex + 1);
        this.setState(assign(this.state, {highlightedSuggestionIndex: index}));
    }

    isAutocompleteShown(): boolean {
        /* tslint:disable:no-string-literal */
        return !!this.refs["autocomplete"];
    }

    async applySuggestion(): Promise<void> {
        this.setText(this.valueWithCurrentSuggestion);
        await this.getSuggestions();
    }

    private setText(text: string): void {
        this.prompt.setValue(text);
        this.setDOMValueProgrammatically(text);
    }

    private get commandNode(): HTMLInputElement {
        /* tslint:disable:no-string-literal */
        return this.refs["command"] as HTMLInputElement;
    }

    private get placeholderNode(): Element {
        /* tslint:disable:no-string-literal */
        return this.refs["placeholder"] as Element;
    }

    private setDOMValueProgrammatically(text: string): void {
        this.commandNode.innerText = text;
        const newCaretPosition = text.length;
        /**
         * Without this line caret position is incorrect when you click on a suggestion
         * because the prompt temporarily loses focus and then restores the previous position.
         */
        this.state.caretPositionFromPreviousFocus = newCaretPosition;

        setCaretPosition(this.commandNode, newCaretPosition);
        this.forceUpdate();
    }

    private isEmpty(): boolean {
        return this.prompt.value.replace(/\s/g, "").length === 0;
    }

    private get valueWithCurrentSuggestion(): string {
        const suggestion = this.state.suggestions[this.state.highlightedSuggestionIndex];

        return suggestion.promptSerializer({
            ast: this.props.job.prompt.ast,
            caretPosition: getCaretPosition(this.commandNode),
            suggestion: suggestion,
        });
    }

    private showAutocomplete(): boolean {
        const ignoredKeyCodes = [
            KeyCode.CarriageReturn,
            KeyCode.Escape,
            KeyCode.Up,
            KeyCode.Down,
        ];

        return this.props.isFocused &&
            this.state.suggestions.length &&
            this.commandNode && !this.isEmpty() &&
            this.props.status === e.Status.NotStarted && !ignoredKeyCodes.includes(this.state.previousKeyCode);
    }

    private async handleInput(event: React.SyntheticEvent<HTMLElement>): Promise<void> {
        this.prompt.setValue((event.target as HTMLElement).innerText);

        await this.getSuggestions();
    }

    private async getSuggestions() {
        let suggestions = await getSuggestions(this.props.job, getCaretPosition(this.commandNode));

        this.setState(assign(this.state, {highlightedSuggestionIndex: 0, suggestions: suggestions}));
    }

    private handleScrollToTop(event: Event) {
        stopBubblingUp(event);

        document.location.href = `#${this.props.job.id}`;
    }

    private handleDrop(event: DragEvent) {
        this.setText(this.prompt.value + (event.dataTransfer.files[0].path));
    }
}
