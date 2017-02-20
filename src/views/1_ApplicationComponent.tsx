import {SessionComponent} from "./2_SessionComponent";
import {TabComponent, TabProps, Tab} from "./TabComponent";
import * as React from "react";
import * as _ from "lodash";
import {ipcRenderer} from "electron";
import {remote} from "electron";
import * as css from "./css/main";
import {saveWindowBounds} from "./ViewUtils";
import {StatusBarComponent} from "./StatusBarComponent";
import {PaneTree, Pane} from "../utils/PaneTree";
import {SearchComponent} from "./SearchComponent";
import {isKeybindingForEvent} from "./keyevents/Keybindings";
import {KeyboardAction} from "../Enums";
import {UserEvent} from "../Interfaces";
import {isModifierKey} from "./ViewUtils";
import {PromptComponent} from "./4_PromptComponent";

type ApplicationState = {
    tabs: Tab[];
    focusedTabIndex: number;
};

export class ApplicationComponent extends React.Component<{}, ApplicationState> {
    constructor(props: {}) {
        super(props);
        // Necessary because "remote" does not exist in electron-mocha tests
        if (remote) {
            const electronWindow = remote.BrowserWindow.getAllWindows()[0];

            electronWindow
                .on("move", () => saveWindowBounds(electronWindow))
                .on("resize", () => {
                    saveWindowBounds(electronWindow);
                    this.recalculateDimensions();
                })
                .webContents
                .on("devtools-opened", () => this.recalculateDimensions())
                .on("devtools-closed", () => this.recalculateDimensions());

            ipcRenderer.on("change-working-directory", (_event: Electron.IpcRendererEvent, directory: string) =>
                this.focusedTab().focusedPane.session.directory = directory,
            );

            window.onbeforeunload = () => {
                electronWindow
                    .removeAllListeners()
                    .webContents
                    .removeAllListeners("devtools-opened")
                    .removeAllListeners("devtools-closed")
                    .removeAllListeners("found-in-page");

                this.closeAllTabs();
            };
        }

        this.state = {
            tabs: [new Tab(this)],
            focusedTabIndex: 0,
        };
    }

    addTab(): void {
        if (this.state.tabs.length < 9) {
            const newTabs = [...this.state.tabs, new Tab(this)];
            this.setState({
                tabs: newTabs,
                focusedTabIndex: newTabs.length - 1,
            });
        } else {
            remote.shell.beep();
        }
    }

    focusTab(position: OneBasedPosition): void {
        const index = position === 9 ? this.state.tabs.length - 1 : position - 1;

        if (this.state.tabs.length > index) {
            this.setState({focusedTabIndex: index} as ApplicationState);
        } else {
            remote.shell.beep();
        }
    }

    closeFocusedTab() {
        this.closeTab(this.focusedTab());

        this.forceUpdate();
    }

    activatePreviousTab() {
        let newPosition = this.state.focusedTabIndex - 1;

        if (newPosition < 0) {
            newPosition = this.state.tabs.length - 1;
        }

        this.focusTab(newPosition + 1);
    }

    activateNextTab() {
        let newPosition = this.state.focusedTabIndex + 1;

        if (newPosition >= this.state.tabs.length) {
            newPosition = 0;
        }

        this.focusTab(newPosition + 1);
    }

    closeFocusedPane() {
        this.focusedTab().closeFocusedPane();

        if (this.focusedTab().panes.size === 0) {
            this.closeTab(this.focusedTab());
        }

        this.forceUpdate();
    }

    handleUserEvent(
        search: SearchComponent,
        event: UserEvent,
    ) {
        const activeJob = this.focusedTab().focusedPane.session.currentJob;
        const prompt: PromptComponent = this.focusedTab().focusedPane.sessionComponent().activeJobComponent().promptComponent();
        // Pasted data
        if (event instanceof ClipboardEvent) {
            if (search.isFocused) {
                return;
            }

            if (!activeJob.isInProgress()) {
                prompt.focus();
                event.preventDefault();
                prompt.appendText(event.clipboardData.getData("text/plain"));
                return;
            }

            activeJob.write(event.clipboardData.getData("text/plain"));

            event.stopPropagation();
            event.preventDefault();

            return;
        }

        // Close focused pane
        if (isKeybindingForEvent(event, KeyboardAction.paneClose) && !activeJob.isInProgress()) {
            this.closeFocusedPane();

            this.forceUpdate();

            event.stopPropagation();
            event.preventDefault();
            return;
        }

        // Change focussed tab
        if (isKeybindingForEvent(event, KeyboardAction.tabFocus)) {
            const position = parseInt(event.key, 10);
            this.focusTab(position);

            event.stopPropagation();
            event.preventDefault();
            return;
        }

        // Enable debug mode
        if (isKeybindingForEvent(event, KeyboardAction.developerToggleDebugMode)) {
            window.DEBUG = !window.DEBUG;

            require("devtron").install();
            console.log(`Debugging mode has been ${window.DEBUG ? "enabled" : "disabled"}.`);

            this.forceUpdate();

            event.stopPropagation();
            event.preventDefault();
            return;
        }

        // Console clear
        if (isKeybindingForEvent(event, KeyboardAction.cliClearJobs) && !activeJob.isInProgress()) {
            this.focusedTab().focusedPane.session.clearJobs();

            event.stopPropagation();
            event.preventDefault();
            return;
        }

        if (event.metaKey) {
            event.stopPropagation();
            // Don't prevent default to be able to open developer tools and such.
            return;
        }

        if (search.isFocused) {
            // Search close
            if (isKeybindingForEvent(event, KeyboardAction.editFindClose)) {
                search.clearSelection();
                setTimeout(() => prompt.focus(), 0);

                event.stopPropagation();
                event.preventDefault();
                return;
            }

            return;
        }

        if (activeJob.isRunningPty() && !isModifierKey(event)) {
            // CLI interrupt
            if (isKeybindingForEvent(event, KeyboardAction.cliInterrupt)) {
                activeJob.interrupt();
            } else {
                activeJob.write(event);
            }

            event.stopPropagation();
            event.preventDefault();
            return;
        }

        prompt.focus();

        // Append last argument to prompt
        if (isKeybindingForEvent(event, KeyboardAction.cliAppendLastArgumentOfPreviousCommand)) {
            prompt.appendLastLArgumentOfPreviousCommand();

            event.stopPropagation();
            event.preventDefault();
            return;
        }

        if (!activeJob.isInProgress()) {
            // CLI Delete word
            if (isKeybindingForEvent(event, KeyboardAction.cliDeleteWord)) {
                prompt.deleteWord();

                event.stopPropagation();
                event.preventDefault();
                return;
            }

            // CLI execute command
            if (isKeybindingForEvent(event, KeyboardAction.cliRunCommand)) {
                prompt.execute((event.target as HTMLElement).innerText);

                event.stopPropagation();
                event.preventDefault();
                return;
            }

            // CLI clear
            if (isKeybindingForEvent(event, KeyboardAction.cliClearText)) {
                prompt.clear();

                event.stopPropagation();
                event.preventDefault();
                return;
            }

            if (prompt.isAutocompleteShown()) {
                if (isKeybindingForEvent(event, KeyboardAction.autocompleteInsertCompletion)) {
                    prompt.applySuggestion();

                    event.stopPropagation();
                    event.preventDefault();
                    return;
                }

                if (isKeybindingForEvent(event, KeyboardAction.autocompletePreviousSuggestion)) {
                    prompt.focusPreviousSuggestion();

                    event.stopPropagation();
                    event.preventDefault();
                    return;
                }

                if (isKeybindingForEvent(event, KeyboardAction.autocompleteNextSuggestion)) {
                    prompt.focusNextSuggestion();

                    event.stopPropagation();
                    event.preventDefault();
                    return;
                }
            } else {
                if (isKeybindingForEvent(event, KeyboardAction.cliHistoryPrevious)) {
                    prompt.scrollIntoView();
                    prompt.setPreviousHistoryItem();

                    event.stopPropagation();
                    event.preventDefault();
                    return;
                }

                if (isKeybindingForEvent(event, KeyboardAction.cliHistoryNext)) {
                    prompt.scrollIntoView();
                    prompt.setNextHistoryItem();

                    event.stopPropagation();
                    event.preventDefault();
                    return;
                }
            }
        }

        prompt.setPreviousKeyCode(event);
    }

    render() {
        let tabs: React.ReactElement<TabProps>[] | undefined;

        if (this.state.tabs.length > 1) {
            tabs = this.state.tabs.map((_tab: Tab, index: number) =>
                <TabComponent
                    isFocused={index === this.state.focusedTabIndex}
                    key={index}
                    position={index + 1}
                    activate={() => {
                        this.setState({
                            focusedTabIndex: index,
                        } as ApplicationState);
                    }}
                    closeHandler={(event: React.MouseEvent<HTMLSpanElement>) => {
                        this.closeTab(this.state.tabs[index]);
                        this.forceUpdate();
                        event.stopPropagation();
                        event.preventDefault();
                    }}
                />,
            );
        }

        return (
            <div style={css.application}>
                <div style={css.titleBar}>
                    <ul style={css.tabs}>{tabs}</ul>
                    <SearchComponent/>
                </div>
                {this.renderPanes(this.focusedTab().panes)}
                <StatusBarComponent presentWorkingDirectory={this.focusedTab().focusedPane.session.directory}/>
            </div>
        );
    }

    focusedTab(): Tab {
        return this.state.tabs[this.state.focusedTabIndex];
    }

    private renderPanes(tree: PaneTree): JSX.Element {
        if (tree instanceof Pane) {
            const pane = tree;
            const session = pane.session;
            const isFocused = pane === this.focusedTab().focusedPane;

            return (
                <SessionComponent
                    session={session}
                    key={session.id}
                    ref={sessionComponent => { pane.setSessionComponent(sessionComponent); }}
                    isFocused={isFocused}
                    updateStatusBar={isFocused ? () => this.forceUpdate() : undefined}
                    focus={() => {
                        this.focusedTab().activatePane(pane);
                        this.forceUpdate();
                    }}>
                </SessionComponent>
            );
        } else {
            return <div style={css.sessions(tree)}>{tree.children.map(child => this.renderPanes(child))}</div>;
        }
    }

    private recalculateDimensions() {
        for (const tab of this.state.tabs) {
            tab.updateAllPanesDimensions();
        }
    }

    private closeTab(tab: Tab, quit = true): void {
        tab.closeAllPanes();
        const newTabs = _.without(this.state.tabs, tab);

        if (newTabs.length === 0 && quit) {
            ipcRenderer.send("quit");
        }

        let newIndex = this.state.focusedTabIndex;
        if (newIndex > 0 && this.state.tabs.indexOf(tab) <= this.state.focusedTabIndex) {
            newIndex -= 1;
        }

        this.setState({
            tabs: newTabs,
            focusedTabIndex: newIndex,
        });
    }

    private closeAllTabs(): void {
        // Can't use forEach here because closeTab changes the array being iterated.
        while (this.state.tabs.length) {
            this.closeTab(this.state.tabs[0], false);
        }
    }
}
