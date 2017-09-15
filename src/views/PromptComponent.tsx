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
    private model = monaco.editor.createModel("", "shell", monaco.Uri.parse(`shell://${this.props.session.id}`));
    private historyModel = monaco.editor.createModel("", "shell-history", monaco.Uri.parse(`shell-history://${this.props.session.id}`));

    /* tslint:disable:member-ordering */
    constructor(props: Props) {
        super(props);
        this.prompt = new Prompt(this.props.session);

        this.state = {
            displayedHistoryRecordID: undefined,
        };
    }

    componentDidMount() {
        this.editor = monaco.editor.create(this.promptContentNode, {
            theme: "upterm-prompt-theme",
            model: this.model,
            lineNumbers: "off",
            fontSize: services.font.size + 2,
            fontFamily: services.font.family,
            suggestFontSize: services.font.size,
            minimap: {enabled: false},
            scrollbar: {
                vertical: "hidden",
                horizontal: "hidden",
            },
            overviewRulerLanes: 0,
            quickSuggestions: true,
            quickSuggestionsDelay: 0,
            parameterHints: true,
            iconsInSuggestions: false,
            wordBasedSuggestions: false,
        });

        services.font.onChange.subscribe(() => {
            this.editor.updateOptions({
                fontSize: services.font.size * 1.2,
                fontFamily: services.font.family,
                suggestFontSize: services.font.size,
            });
            this.editor.layout();
        });

        this.editor.addCommand(
            monaco.KeyCode.UpArrow,
            () => this.setPreviousHistoryItem(),
            "!suggestWidgetVisible",
        );
        this.editor.addCommand(
            monaco.KeyMod.WinCtrl | monaco.KeyCode.KEY_P,
            () => this.setPreviousHistoryItem(),
            "!suggestWidgetVisible",
        );
        this.editor.addCommand(
            monaco.KeyCode.DownArrow,
            () => this.setNextHistoryItem(),
            "!suggestWidgetVisible",
        );
        this.editor.addCommand(
            monaco.KeyMod.WinCtrl | monaco.KeyCode.KEY_N,
            () => this.setNextHistoryItem(),
            "!suggestWidgetVisible",
        );
        this.addShortcut(
            monaco.KeyMod.WinCtrl | monaco.KeyCode.KEY_B,
            "cursorLeft",
        );
        this.addShortcut(
            monaco.KeyMod.Alt | monaco.KeyCode.KEY_B,
            "cursorWordStartLeft",
        );
        this.addShortcut(
            monaco.KeyMod.WinCtrl | monaco.KeyCode.KEY_F,
            "cursorRight",
        );
        this.addShortcut(
            monaco.KeyMod.Alt | monaco.KeyCode.KEY_F,
            "cursorWordEndRight",
        );
        this.addShortcut(
            monaco.KeyMod.WinCtrl | monaco.KeyCode.KEY_W,
            "deleteWordLeft",
        );
        this.addShortcut(
            monaco.KeyMod.Alt | monaco.KeyCode.KEY_D,
            "deleteWordRight",
        );

        this.focus();
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

    startHistorySearch() {
        this.editor.setModel(this.historyModel);
        this.setValue(this.model.getValue());
        this.triggerSuggest();
    }

    acceptSelectedSuggestion() {
        this.editor.trigger("", "acceptSelectedSuggestion", {});

        if (this.isInHistorySearch()) {
            this.cancelHistorySearch();
        } else {
            this.triggerSuggest();
        }
    }

    cancelHistorySearch() {
        this.editor.setModel(this.model);
        this.setValue(this.historyModel.getValue());
    }

    isInHistorySearch(): boolean {
        return this.editor.getModel() === this.historyModel;
    }

    focus(): void {
        this.editor.focus();
    }

    clear(): void {
        this.setValue("");
    }

    async appendLastLArgumentOfPreviousCommand(): Promise<void> {
        const latestHistoryRecord = services.history.latest;

        if (latestHistoryRecord) {
            this.setValue(this.prompt.value + _.last(scan(latestHistoryRecord.command))!.value);
        }
    }

    async execute(promptText: string): Promise<void> {
        promptText = this.editor.getValue();
        this.prompt.setValue(promptText);

        if (!this.isEmpty()) {
            this.props.session.createJob(this.prompt);
            this.editor.setValue("");
            this.setState({
                displayedHistoryRecordID: undefined,
            });
        }
    }

    setValue(value: string): void {
        this.editor.setValue(value);
        this.editor.setPosition({lineNumber: 1, column: value.length + 1});
        this.prompt.setValue(value);
        this.focus();
    }

    private setPreviousHistoryItem(): void {
        const currentID = this.state.displayedHistoryRecordID;
        if (currentID) {
            const currentRecord = services.history.get(currentID);
            const previousRecord = _.findLast(
                services.history.all,
                record => record.id < currentID && record.command !== currentRecord.command,
            );

            if (previousRecord) {
                this.setValue(previousRecord.command);
                this.setState({displayedHistoryRecordID: previousRecord.id});
            }
        } else {
            const previousRecord = services.history.latest;
            if (previousRecord) {
                this.setValue(previousRecord.command);
                this.setState({displayedHistoryRecordID: previousRecord.id});
            }
        }
    }

    private setNextHistoryItem(): void {
        const currentID = this.state.displayedHistoryRecordID;
        if (currentID) {
            const currentRecord = services.history.get(currentID);
            const nextRecord = _.find(
                services.history.all,
                record => record.id > currentID && record.command !== currentRecord.command,
            );
            if (nextRecord) {
                this.setValue(nextRecord.command);
                this.setState({displayedHistoryRecordID: nextRecord.id});
            } else {
                this.setValue("");
                this.setState({displayedHistoryRecordID: undefined});
            }
        }
    }

    private get promptContentNode(): HTMLDivElement {
        /* tslint:disable:no-string-literal */
        return this.refs["prompt-content"] as HTMLDivElement;
    }

    private isEmpty(): boolean {
        return this.prompt.value.replace(/\s/g, "").length === 0;
    }

    private triggerSuggest() {
        this.editor.trigger(this.editor.getValue(), "editor.action.triggerSuggest", {});
    }

    private addShortcut(keybinding: number, handlerId: string) {
        this.editor.addCommand(
            keybinding,
            () => this.editor.trigger("", handlerId, {}),
            "",
        );
    }
}
