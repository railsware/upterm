/// <reference path="../../node_modules/monaco-editor/monaco.d.ts" />

import * as _ from "lodash";
import * as React from "react";
import {Prompt} from "../shell/Prompt";
import {scan} from "../shell/Scanner";
import {Session} from "../shell/Session";
import {services} from "../services/index";

interface Props {
    session: Session;
    isFocused: boolean;
}

interface State {
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
}
