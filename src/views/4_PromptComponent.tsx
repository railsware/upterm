import * as _ from "lodash";
import * as e from "../Enums";
import * as React from "react";
import AutocompleteComponent from "./AutocompleteComponent";
import DecorationToggleComponent from "./DecorationToggleComponent";
import History from "../History";
import {stopBubblingUp, keys, getCaretPosition, setCaretPosition, withModifierKey, isSpecialKey} from "./ViewUtils";
import JobComponent from "./3_JobComponent";
import PromptModel from "../Prompt";
import JobModel from "../Job";
import {Suggestion} from "../plugins/autocompletion_providers/Suggestions";
import {KeyCode} from "../Enums";
import {getSuggestions} from "../Autocompletion";
import {Subject} from "rxjs/Subject";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import {InputMethod} from "../Parser";
import * as css from "./css/main";
import {fontAwesome} from "./css/FontAwesome";
import {Status} from "../Enums";
const reactDOM = require("react-dom");

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

        const keyDownSubject: Subject<KeyboardEvent> = new Subject();


        keyDownSubject // Should be before setting latestKeyCode.
            .filter((event: KeyboardEvent) => event.keyCode === KeyCode.Period && (event.altKey || this.state.latestKeyCode === KeyCode.Escape))
            .forEach((event: KeyboardEvent) => this.appendLastLexemeOfPreviousJob(event));

        keyDownSubject
            .filter(_.negate(withModifierKey))
            .forEach((event: KeyboardEvent) => this.setState({latestKeyCode: event.keyCode}));


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
            .filter(keys.interrupt).forEach(() => this.prompt.setValue("").then(() => this.setDOMValueProgrammatically("")));
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

        this.setDOMValueProgrammatically(this.prompt.value);
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
        const classes = ["prompt-wrapper", this.props.status].join(" ");
        // FIXME: write better types.
        let autocomplete: any;
        let autocompletedPreview: any;
        let inlineSynopsis: any;
        let decorationToggle: any;
        let scrollToTop: any;

        if (this.showAutocomplete()) {
            autocomplete = <AutocompleteComponent suggestions={this.state.suggestions}
                                                  caretOffset={$(this.commandNode).caret("offset")}
                                                  onSuggestionHover={this.highlightSuggestion.bind(this)}
                                                  onSuggestionClick={this.applySuggestion.bind(this)}
                                                  highlightedIndex={this.state.highlightedSuggestionIndex}
                                                  ref="autocomplete"/>;
            const completed = this.valueWithCurrentSuggestion;
            if (completed.trim() !== this.prompt.value && completed.startsWith(this.prompt.value)) {
                autocompletedPreview = <div style={css.autocompletedPreview}>{completed}</div>;
            } else {
                const highlightedSuggestion = this.state.suggestions[this.state.highlightedSuggestionIndex];
                if (highlightedSuggestion.synopsis) {
                    inlineSynopsis = <div style={css.inlineSynopsis}>{this.prompt.value} —— {highlightedSuggestion.synopsis}</div>;
                }
            }
        }

        if (this.props.jobView.state.canBeDecorated) {
            decorationToggle = <DecorationToggleComponent job={this.props.jobView}/>;
        }

        if (this.props.status !== e.Status.NotStarted && this.props.job.buffer.size > 100) {
            scrollToTop = <span style={css.action}
                             onClick={this.handleScrollToTop.bind(this)}
                             dangerouslySetInnerHTML={{__html: fontAwesome.longArrowUp}}/>;
        }

        return (
            <div className={classes} style={css.promptWrapper(this.props.status)}>
                <div style={css.arrow(this.props.status)}>
                    <div style={css.arrowInner(this.props.status)}></div>
                </div>
                <div style={css.promptInfo(this.props.status)}
                     title={JSON.stringify(this.props.status)}
                     dangerouslySetInnerHTML={{__html: this.props.status === Status.Interrupted ? fontAwesome.close : ""}}></div>
                <div className="prompt"
                     style={css.prompt}
                     onKeyDown={this.handlers.onKeyDown.bind(this)}
                     onInput={this.handleInput.bind(this)}
                     onKeyPress={this.handleKeyPress.bind(this)}
                     type="text"
                     ref="command"
                     contentEditable={this.props.status === e.Status.NotStarted || this.props.status === e.Status.InProgress}></div>
                {autocompletedPreview}
                {inlineSynopsis}
                {autocomplete}
                <div style={css.actions}>
                    {decorationToggle}
                    {scrollToTop}
                </div>
            </div>
        );
    }

    private async execute(event: KeyboardEvent): Promise<void> {
        await this.prompt.setValue((event.target as HTMLElement).innerText);

        if (!this.isEmpty()) {
            this.prompt.execute();
        }
    }

    private get commandNode(): HTMLInputElement {
        /* tslint:disable:no-string-literal */
        return this.refs["command"] as HTMLInputElement;
    }

    private setDOMValueProgrammatically(text: string): void {
        this.commandNode.innerText = text;
        setCaretPosition(this.commandNode, text.length);

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

            await this.prompt.setValue(current + this.prompt.value.substring(getCaretPosition(this.commandNode)));
            this.setDOMValueProgrammatically(this.prompt.value);
        }
    }

    private isEmpty(): boolean {
        return this.prompt.value.replace(/\s/g, "").length === 0;
    }

    private async navigateHistory(event: KeyboardEvent): Promise<void> {
        let newValue = keys.goUp(event) ? History.getPrevious() : History.getNext();

        await this.prompt.setValue(newValue);
        this.setDOMValueProgrammatically(newValue);
    }

    private async appendLastLexemeOfPreviousJob(event: KeyboardEvent): Promise<void> {
        event.stopPropagation();
        event.preventDefault();

        const value = this.prompt.value + History.lastEntry.lastLexeme;
        await this.prompt.setValue(value);
        this.setDOMValueProgrammatically(value);
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

    private async applySuggestion(): Promise<void> {
        await this.prompt.setValue(this.valueWithCurrentSuggestion);
        this.setDOMValueProgrammatically(this.prompt.value);

        await this.getSuggestions();
    }

    private get valueWithCurrentSuggestion(): string {
        let state = this.state;
        const suggestion = state.suggestions[state.highlightedSuggestionIndex];
        const valueFromCaret = this.prompt.value.slice(getCaretPosition(this.commandNode));

        return suggestion.prefix + suggestion.value + valueFromCaret;
    }

    private showAutocomplete(): boolean {
        // TODO: use streams.
        return this.props.hasLocusOfAttention &&
            this.state.suggestions.length &&
            this.commandNode && !this.isEmpty() &&
            this.props.status === e.Status.NotStarted && ![KeyCode.CarriageReturn, KeyCode.Escape].includes(this.state.latestKeyCode);
    }

    private isAutocompleteShown(): boolean {
        /* tslint:disable:no-string-literal */
        return !!this.refs["autocomplete"];
    }

    private async handleInput(event: React.SyntheticEvent): Promise<void> {
        await this.prompt.setValue((event.target as HTMLElement).innerText);

        await this.getSuggestions();
    }

    private async getSuggestions() {
        const inputMethod = (this.state.latestKeyCode === KeyCode.Tab) ? InputMethod.Autocompleted : InputMethod.Typed;
        let suggestions = await getSuggestions(this.props.job, inputMethod);

        this.setState({highlightedSuggestionIndex: 0, suggestions: suggestions});
    }

    private handleScrollToTop(event: Event) {
        stopBubblingUp(event);

        const offset = $(reactDOM.findDOMNode(this.props.jobView)).offset().top - 10;
        $("html, body").animate({scrollTop: offset}, 300);
    }

    private handleKeyPress(event: Event) {
        if (this.props.status === e.Status.InProgress) {
            stopBubblingUp(event);
        }
    }
}
