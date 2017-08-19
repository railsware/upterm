/// <reference path="../../node_modules/monaco-editor/monaco.d.ts" />

import * as _ from "lodash";
import * as React from "react";
import {getCaretPosition} from "./ViewUtils";
import {Prompt} from "../shell/Prompt";
import {SuggestionWithDefaults} from "../plugins/autocompletion_utils/Common";
import {KeyCode} from "../Enums";
import {getSuggestions} from "../Autocompletion";
import {scan} from "../shell/Scanner";
import {Session} from "../shell/Session";
import {services} from "../services/index";

interface Props {
    session: Session;
    isFocused: boolean;
}

interface State {
    highlightedSuggestionIndex: number;
    previousKeyCode: number;
    caretPositionFromPreviousFocus: number;
    suggestions: SuggestionWithDefaults[];
    displayedHistoryRecordID: number | undefined;
}

export class PromptComponent extends React.Component<Props, State> {
    private prompt: Prompt;
    private editor: monaco.editor.IStandaloneCodeEditor;

    /* tslint:disable:member-ordering */
    constructor(props: Props) {
        super(props);
        this.prompt = new Prompt(this.props.session);

        this.state = {
            highlightedSuggestionIndex: 0,
            previousKeyCode: KeyCode.Escape,
            caretPositionFromPreviousFocus: 0,
            suggestions: [],
            displayedHistoryRecordID: undefined,
        };
    }

    componentDidMount() {
        const model = monaco.editor.createModel("", "shell", monaco.Uri.parse(`inmemory://${this.props.session.id}.sh`));

        this.editor = monaco.editor.create(this.promptContentNode, {
            theme: "upterm-prompt-theme",
            model: model,
            lineNumbers: "off",
            fontSize: 16,
            minimap: { enabled: false },
            scrollbar: {
                vertical: "hidden",
                horizontal: "hidden",
            },
            overviewRulerLanes: 0,
        });
    }

    componentDidUpdate(prevProps: Props) {
        if (!prevProps.isFocused && this.props.isFocused) {
            this.focus();
        }
    }

    render() {
        return (
            <div className="prompt">
                <div className="prompt-decoration">
                    <div className="square"/>
                    <div className="square rhombus"/>
                </div>
                <div className="prompt-content" ref="prompt-content"/>
            </div>
        );
    }

    focus(): void {
        if (document.activeElement === this.commandNode) {
            return;
        }

        this.editor.focus();

        // this.commandNode.focus();

        // if (this.prompt.value) {
        //     setCaretPosition(this.commandNode, this.state.caretPositionFromPreviousFocus);
        // }
    }

    clear(): void {
        this.setText("");
    }

    setPreviousKeyCode(event: KeyboardEvent) {
        this.setState({
            ...this.state,
            previousKeyCode: event.keyCode,
        });
    }

    async appendLastLArgumentOfPreviousCommand(): Promise<void> {
        const latestHistoryRecord = services.history.latest;

        if (latestHistoryRecord) {
            this.setText(this.prompt.value + _.last(scan(latestHistoryRecord.command))!.value);
        }
    }

    async execute(promptText: string): Promise<void> {
        promptText = this.editor.getValue();
        this.prompt.setValue(promptText);

        if (!this.isEmpty()) {
            this.props.session.createJob(this.prompt);
            this.editor.setValue("");
            this.setDOMValueProgrammatically("");
            this.setState({
                highlightedSuggestionIndex: 0,
                previousKeyCode: KeyCode.Escape,
                caretPositionFromPreviousFocus: 0,
                suggestions: [],
                displayedHistoryRecordID: undefined,
            });
        }
    }

    setPreviousHistoryItem(): void {
        const currentID = this.state.displayedHistoryRecordID;
        if (currentID) {
            const currentRecord = services.history.get(currentID);
            const previousRecord = _.findLast(
                services.history.all,
                record => record.id < currentID && record.command !== currentRecord.command,
            );

            if (previousRecord) {
                this.setText(previousRecord.command);
                this.setState({displayedHistoryRecordID: previousRecord.id});
            }
        } else {
            const previousRecord = services.history.latest;
            if (previousRecord) {
                this.setText(previousRecord.command);
                this.setState({displayedHistoryRecordID: previousRecord.id});
            }
        }
    }

    setNextHistoryItem(): void {
        const currentID = this.state.displayedHistoryRecordID;
        if (currentID) {
            const currentRecord = services.history.get(currentID);
            const nextRecord = _.find(
                services.history.all,
                record => record.id > currentID && record.command !== currentRecord.command,
            );
            if (nextRecord) {
                this.setText(nextRecord.command);
                this.setState({displayedHistoryRecordID: nextRecord.id});
            } else {
                this.setText("");
                this.setState({displayedHistoryRecordID: undefined});
            }
        }
    }

    focusPreviousSuggestion(): void {
        const index = Math.max(0, this.state.highlightedSuggestionIndex - 1);
        this.setState({...this.state, highlightedSuggestionIndex: index});
    }

    focusNextSuggestion(): void {
        const index = Math.min(this.state.suggestions.length - 1, this.state.highlightedSuggestionIndex + 1);
        this.setState({...this.state, highlightedSuggestionIndex: index});
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

    private get promptContentNode(): HTMLDivElement {
        /* tslint:disable:no-string-literal */
        return this.refs["prompt-content"] as HTMLDivElement;
    }

    private get commandNode(): HTMLInputElement {
        /* tslint:disable:no-string-literal */
        return this.refs["command"] as HTMLInputElement;
    }

    private setDOMValueProgrammatically(_text: string): void {
        // this.commandNode.innerText = text;
        // const newCaretPosition = text.length;
        // /**
        //  * Without this line caret position is incorrect when you click on a suggestion
        //  * because the prompt temporarily loses focus and then restores the previous position.
        //  */
        // (this.state as any).caretPositionFromPreviousFocus = newCaretPosition;
        //
        // if (text.length) {
        //     setCaretPosition(this.commandNode, newCaretPosition);
        // }
        //
        // this.setState({suggestions: [], highlightedSuggestionIndex: 0});
    }

    private isEmpty(): boolean {
        return this.prompt.value.replace(/\s/g, "").length === 0;
    }

    private get valueWithCurrentSuggestion(): string {
        const suggestion = this.state.suggestions[this.state.suggestions.length - 1 - this.state.highlightedSuggestionIndex];

        return suggestion.promptSerializer({
            ast: this.prompt.ast,
            caretPosition: getCaretPosition(this.commandNode),
            suggestion: suggestion,
        });
    }

    private async getSuggestions() {
        let suggestions = await getSuggestions({
            currentText: this.prompt.value,
            currentCaretPosition: getCaretPosition(this.commandNode),
            ast: this.prompt.ast,
            environment: this.props.session.environment,
            historicalPresentDirectoriesStack: this.props.session.historicalPresentDirectoriesStack,
            aliases: this.props.session.aliases,
        });

        this.setState({...this.state, highlightedSuggestionIndex: suggestions.length - 1, suggestions: suggestions});
    }
}
