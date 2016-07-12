import * as _ from "lodash";
import * as e from "../Enums";
import * as React from "react";
import {AutocompleteComponent} from "./AutocompleteComponent";
import {DecorationToggleComponent} from "./DecorationToggleComponent";
import {History} from "../shell/History";
import {stopBubblingUp, keys, getCaretPosition, setCaretPosition, withModifierKey, isSpecialKey} from "./ViewUtils";
import {Prompt} from "../shell/Prompt";
import {Job} from "../shell/Job";
import {Suggestion} from "../plugins/autocompletion_providers/Common";
import {KeyCode} from "../Enums";
import {getSuggestions} from "../Autocompletion";
import {Subject} from "rxjs/Subject";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import * as css from "./css/main";
import {fontAwesome} from "./css/FontAwesome";
import {Status} from "../Enums";
import {scan} from "../shell/Scanner";
import {leafNodeAt, serializeReplacing} from "../shell/Parser";
import {assign} from "../utils/Common";

interface Props {
    job: Job;
    status: e.Status;
    decorateToggler: () => boolean;
    hasLocusOfAttention: boolean;
}

interface State {
    highlightedSuggestionIndex: number;
    latestKeyCode: number;
    offsetTop: number;
    caretPositionFromPreviousFocus: number;
    suggestions: Suggestion[];
    isSticky: boolean;
}


// TODO: Make sure we only update the view when the model changes.
export class PromptComponent extends React.Component<Props, State> implements KeyDownReceiver {
    private prompt: Prompt;
    private handlers: {
        onKeyDown: Function;
    };

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

    constructor(props: Props) {
        super(props);
        this.prompt = this.props.job.prompt;

        this.state = {
            highlightedSuggestionIndex: 0,
            latestKeyCode: KeyCode.Escape,
            offsetTop: 0,
            caretPositionFromPreviousFocus: 0,
            suggestions: [],
            isSticky: false,
        };

        const keyDownSubject: Subject<KeyboardEvent> = new Subject();


        keyDownSubject // Should be before setting latestKeyCode.
            .filter((event: KeyboardEvent) => event.keyCode === KeyCode.Period && (event.altKey || this.state.latestKeyCode === KeyCode.Escape))
            .forEach((event: KeyboardEvent) => this.appendLastLexemeOfPreviousJob(event));

        keyDownSubject
            .filter(_.negate(withModifierKey))
            .forEach((event: KeyboardEvent) => this.setState(assign(this.state, {
                latestKeyCode: event.keyCode,
                offsetTop: (event.target as HTMLDivElement).getBoundingClientRect().top}
            )));


        const promptKeys = keyDownSubject.filter(() => this.props.status !== e.Status.InProgress)
            .filter(isSpecialKey)
            .map(stopBubblingUp);
        promptKeys
            .filter(() => this.isAutocompleteShown())
            .filter(keys.tab)
            .forEach(() => this.applySuggestion());
        promptKeys
            .filter(keys.deleteWord).forEach(() => this.deleteWord());
        promptKeys
            .filter(keys.enter).forEach((event: KeyboardEvent) => this.execute(event));
        promptKeys
            .filter(keys.interrupt).forEach(() => {
            this.prompt.setValue("");
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
            onKeyDown: (event: KeyboardEvent) => keyDownSubject.next(event),
        };

        // FIXME: find a better design to propagate events.
        if (this.props.hasLocusOfAttention) {
            window.promptUnderAttention = this;
        }

        document.addEventListener(
            "dragover",
            function(event) {
                event.preventDefault();
                return false;
            },
            false
        );

        document.addEventListener(
            "drop",
            function(event) {
                event.preventDefault();
                return false;
            },
            false
        );
    }

    handleKeyDown(event: KeyboardEvent): void {
        this.commandNode.focus();
    }

    componentDidMount() {
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

        this.intersectionObserver.observe(this.placeholderNode);

        this.setDOMValueProgrammatically(this.prompt.value);
    }

    componentWillUnmount() {
        this.intersectionObserver.unobserve(this.placeholderNode);
        this.intersectionObserver.disconnect();
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

        let promptCss = Object.assign({}, css.prompt);
        if (this.state.isSticky) {
            promptCss.whiteSpace = "nowrap";
            scrollToTop = <span style={css.action}
                                title="Scroll to beginning of output."
                                onClick={this.handleScrollToTop.bind(this)}
                                dangerouslySetInnerHTML={{__html: fontAwesome.longArrowUp}}/>;
        }

        return (
            <div className="prompt-placeholder" ref="placeholder" id={this.props.job.id} style={css.promptPlaceholder}>
                <div className="prompt-wrapper" style={css.promptWrapper(this.props.status, this.state.isSticky)}>
                    <div style={css.arrow(this.props.status)}>
                        <div style={css.arrowInner(this.props.status)}></div>
                    </div>
                    <div style={css.promptInfo(this.props.status)}
                         title={JSON.stringify(this.props.status)}
                         dangerouslySetInnerHTML={{__html: this.props.status === Status.Interrupted ? fontAwesome.close : ""}}></div>
                    <div className="prompt"
                         style={promptCss}
                         onKeyDown={event => this.handlers.onKeyDown(event)}
                         onInput={this.handleInput.bind(this)}
                         onKeyPress={() => this.props.status === e.Status.InProgress && stopBubblingUp(event)}
                         onDrop={this.handleDrop.bind(this)}
                         onBlur={() => this.setState(assign(this.state, {caretPositionFromPreviousFocus: getCaretPosition(this.commandNode)}))}
                         onFocus={() => setCaretPosition(this.commandNode, this.state.caretPositionFromPreviousFocus)}
                         type="text"
                         ref="command"
                         contentEditable={this.props.status === e.Status.NotStarted || this.props.status === e.Status.InProgress}></div>
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

    private async execute(event: KeyboardEvent): Promise<void> {
        this.prompt.setValue((event.target as HTMLElement).innerText);

        if (!this.isEmpty()) {
            this.props.job.execute();
        }
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

    private async deleteWord(current = this.prompt.value, position = getCaretPosition(this.commandNode)): Promise<void> {
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

    private isEmpty(): boolean {
        return this.prompt.value.replace(/\s/g, "").length === 0;
    }

    private async navigateHistory(event: KeyboardEvent): Promise<void> {
        let newValue = keys.goUp(event) ? History.getPrevious() : History.getNext();

        this.prompt.setValue(newValue);
        this.setDOMValueProgrammatically(newValue);
    }

    private async appendLastLexemeOfPreviousJob(event: KeyboardEvent): Promise<void> {
        event.stopPropagation();
        event.preventDefault();

        const value = this.prompt.value + _.last(scan(History.latest)).value;
        this.prompt.setValue(value);
        this.setDOMValueProgrammatically(value);
    }

    private navigateAutocomplete(event: KeyboardEvent): void {
        let index: number;
        if (keys.goUp(event)) {
            index = Math.max(0, this.state.highlightedSuggestionIndex - 1);
        } else {
            index = Math.min(this.state.suggestions.length - 1, this.state.highlightedSuggestionIndex + 1);
        }

        this.setState(assign(this.state, {highlightedSuggestionIndex: index}));
    }

    private async applySuggestion(): Promise<void> {
        this.prompt.setValue(this.valueWithCurrentSuggestion);
        this.setDOMValueProgrammatically(this.prompt.value);

        await this.getSuggestions();
    }

    private get valueWithCurrentSuggestion(): string {
        const state = this.state;
        const ast = this.props.job.prompt.ast;
        const suggestion = state.suggestions[state.highlightedSuggestionIndex];
        const node = leafNodeAt(getCaretPosition(this.commandNode), ast);

        return serializeReplacing(ast, node, suggestion.value.replace(/\s/g, "\\ ") + (suggestion.shouldAddSpace ? " " : ""));
    }

    private showAutocomplete(): boolean {
        const ignoredKeyCodes = [
            KeyCode.CarriageReturn,
            KeyCode.Escape,
            KeyCode.Up,
            KeyCode.Down,
        ];

        // TODO: use streams.
        return this.props.hasLocusOfAttention &&
            this.state.suggestions.length &&
            this.commandNode && !this.isEmpty() &&
            this.props.status === e.Status.NotStarted && !ignoredKeyCodes.includes(this.state.latestKeyCode);
    }

    private isAutocompleteShown(): boolean {
        /* tslint:disable:no-string-literal */
        return !!this.refs["autocomplete"];
    }

    private async handleInput(event: React.SyntheticEvent<HTMLElement>): Promise<void> {
        this.prompt.setValue(event.target.innerText);

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
        this.prompt.setValue(this.prompt.value + (event.dataTransfer.files[0].path));
        this.setDOMValueProgrammatically(this.prompt.value);
    }
}
