import {SessionComponent} from "./2_SessionComponent";
import {PromptComponent} from "./4_PromptComponent";
import {JobComponent} from "./3_JobComponent";
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

export class ApplicationComponent extends React.Component<{}, {}> {
    private tabs: Tab[] = [];
    private focusedTabIndex: number;

    constructor(props: {}) {
        super(props);
        const electronWindow = remote.BrowserWindow.getAllWindows()[0];

        this.addTab(false);

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
            this.focusedTab.focusedPane.session.directory = directory,
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

        window.application = this;
    }

    addTab(forceUpdate = true): void {
        if (this.tabs.length < 9) {
            this.tabs.push(new Tab(this));
            this.focusedTabIndex = this.tabs.length - 1;
            if (forceUpdate) this.forceUpdate();
        } else {
            remote.shell.beep();
        }

        window.focusedTab = this.focusedTab;
    }

    focusTab(position: OneBasedPosition): void {
        const index = position === 9 ? this.tabs.length : position - 1;

        if (this.tabs.length > index) {
            this.focusedTabIndex = index;
            this.forceUpdate();
        } else {
            remote.shell.beep();
        }

        window.focusedTab = this.focusedTab;
    }

    closeFocusedTab() {
        this.closeTab(this.focusedTab);

        this.forceUpdate();
    }

    activatePreviousTab() {
        let newPosition = this.focusedTabIndex - 1;

        if (newPosition < 0) {
            newPosition = this.tabs.length - 1;
        }

        this.focusTab(newPosition + 1);
    }

    activateNextTab() {
        let newPosition = this.focusedTabIndex + 1;

        if (newPosition >= this.tabs.length) {
            newPosition = 0;
        }

        this.focusTab(newPosition + 1);
    }

    closeFocusedPane() {
        this.focusedTab.closeFocusedPane();

        if (this.focusedTab.panes.size === 0) {
            this.closeTab(this.focusedTab);
        }

        this.forceUpdate();
    }

    handleUserEvent(
        session: SessionComponent,
        job: JobComponent,
        prompt: PromptComponent,
        search: SearchComponent,
        event: UserEvent,
    ) {
        // Pasted data
        if (event instanceof ClipboardEvent) {
            if (search.isFocused) {
                return;
            }

            if (!job.props.job.isInProgress()) {
                prompt.focus();
                event.preventDefault();
                prompt.appendText(event.clipboardData.getData("text/plain"));
                return;
            }

            job.props.job.write(event.clipboardData.getData("text/plain"));

            event.stopPropagation();
            event.preventDefault();

            return;
        }

        // Close focused pane
        if (isKeybindingForEvent(event, KeyboardAction.paneClose) && !job.props.job.isInProgress()) {
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
        if (isKeybindingForEvent(event, KeyboardAction.cliClearJobs) && !job.props.job.isInProgress()) {
            session.props.session.clearJobs();

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

        if (job.props.job.isRunningPty() && !isModifierKey(event)) {
            // CLI interrupt
            if (isKeybindingForEvent(event, KeyboardAction.cliInterrupt)) {
                job.props.job.interrupt();
            } else {
                job.props.job.write(event);
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

        if (!job.props.job.isInProgress()) {
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

        if (this.tabs.length > 1) {
            tabs = this.tabs.map((_tab: Tab, index: number) =>
                <TabComponent isFocused={index === this.focusedTabIndex}
                              key={index}
                              position={index + 1}
                              activate={() => {
                                this.focusedTabIndex = index;
                                this.forceUpdate();
                              }}
                              closeHandler={(event: React.MouseEvent<HTMLSpanElement>) => {
                                  this.closeTab(this.tabs[index]);
                                  this.forceUpdate();

                                  event.stopPropagation();
                                  event.preventDefault();
                              }}>
                </TabComponent>,
            );
        }

        return (
            <div style={css.application}>
                <div style={css.titleBar}>
                    <ul style={css.tabs}>{tabs}</ul>
                    <SearchComponent/>
                </div>
                {this.renderPanes(this.focusedTab.panes)}
                <StatusBarComponent presentWorkingDirectory={this.focusedTab.focusedPane.session.directory}/>
            </div>
        );
    }

    private renderPanes(tree: PaneTree): JSX.Element {
        if (tree instanceof Pane) {
            const pane = tree;
            const session = pane.session;
            const isFocused = pane === this.focusedTab.focusedPane;

            return (
                <SessionComponent session={session}
                                  key={session.id}
                                  isFocused={isFocused}
                                  updateStatusBar={isFocused ? () => this.forceUpdate() : undefined}
                                  focus={() => {
                                      this.focusedTab.activatePane(pane);
                                      this.forceUpdate();
                                  }}>
                </SessionComponent>
            );
        } else {
            return <div style={css.sessions(tree)}>{tree.children.map(child => this.renderPanes(child))}</div>;
        }
    }

    private recalculateDimensions() {
        for (const tab of this.tabs) {
            tab.updateAllPanesDimensions();
        }
    }

    private get focusedTab(): Tab {
        return this.tabs[this.focusedTabIndex];
    }

    private closeTab(tab: Tab, quit = true): void {
        tab.closeAllPanes();
        _.pull(this.tabs, tab);

        if (this.tabs.length === 0 && quit) {
            ipcRenderer.send("quit");
        } else if (this.tabs.length === this.focusedTabIndex) {
            this.focusedTabIndex -= 1;
        }

        window.focusedTab = this.focusedTab;
    }

    private closeAllTabs(): void {
        // Can't use forEach here because closeTab changes the array being iterated.
        while (this.tabs.length) {
            this.closeTab(this.tabs[0], false);
        }
    }
}
