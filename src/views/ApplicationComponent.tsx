import {TabHeaderComponent, Props, Tab} from "./TabHeaderComponent";
import * as React from "react";
import * as _ from "lodash";
import {ipcRenderer} from "electron";
import {remote} from "electron";
import * as css from "./css/styles";
import {saveWindowBounds} from "./ViewUtils";
import {SearchComponent} from "./SearchComponent";
import {isMenuShortcut, isKeybindingForEvent} from "./keyevents/Keybindings";
import {KeyboardAction} from "../Enums";
import {UserEvent} from "../Interfaces";
import {isModifierKey} from "./ViewUtils";
import {TabComponent} from "./TabComponent";
import {FontService} from "../services/FontService";

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

            ipcRenderer.on("change-working-directory", (_event: Event, directory: string) =>
                this.focusedTab.focusedPane.session.directory = directory,
            );

            FontService.instance.onChange(() => this.forceUpdate());

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
        this.closeTab(this.focusedTab);

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
        this.focusedTab.closeFocusedPane();

        if (this.focusedTab.panes.size === 0) {
            this.closeTab(this.focusedTab);
        }

        this.forceUpdate();
    }

    handleUserEvent(
        search: SearchComponent,
        event: UserEvent,
    ) {
        const currentJob = this.focusedTab.focusedPane.session.currentJob;
        const promptComponent = this.focusedTab.focusedPane.paneComponent.promptComponent;

        // Pasted data
        if (event instanceof ClipboardEvent) {
            if (search.isFocused) {
                return;
            }

            if (promptComponent) {
                promptComponent.focus();
                document.execCommand("inserttext", false, event.clipboardData.getData("text/plain"));
            }

            if (currentJob) {
                currentJob.write(event.clipboardData.getData("text/plain"));
            }

            event.stopPropagation();
            event.preventDefault();

            return;
        }

        if (isModifierKey(event) || isMenuShortcut(event)) {
            return;
        }

        // Close focused pane
        if (isKeybindingForEvent(event, KeyboardAction.paneClose) && promptComponent) {
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
        if (isKeybindingForEvent(event, KeyboardAction.cliClearJobs) && promptComponent) {
            this.focusedTab.focusedPane.session.clearJobs();

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

                event.stopPropagation();
                event.preventDefault();
                return;
            }

            return;
        }

        if (currentJob && currentJob.isRunningPty()) {
            currentJob.write(event);

            event.stopPropagation();
            event.preventDefault();
            return;
        }

        if (!promptComponent) {
            return;
        }

        promptComponent.focus();

        // Append last argument to prompt
        if (isKeybindingForEvent(event, KeyboardAction.cliAppendLastArgumentOfPreviousCommand)) {
            promptComponent.appendLastLArgumentOfPreviousCommand();

            event.stopPropagation();
            event.preventDefault();
            return;
        }

        // CLI execute command
        if (isKeybindingForEvent(event, KeyboardAction.cliRunCommand)) {
            promptComponent.execute((event.target as HTMLElement).innerText);

            event.stopPropagation();
            event.preventDefault();
            return;
        }

        // CLI clear
        if (isKeybindingForEvent(event, KeyboardAction.cliClearText)) {
            promptComponent.clear();

            event.stopPropagation();
            event.preventDefault();
            return;
        }

        if (promptComponent.isAutocompleteShown()) {
            if (isKeybindingForEvent(event, KeyboardAction.autocompleteInsertCompletion)) {
                promptComponent.applySuggestion();

                event.stopPropagation();
                event.preventDefault();
                return;
            }

            if (isKeybindingForEvent(event, KeyboardAction.autocompletePreviousSuggestion)) {
                promptComponent.focusPreviousSuggestion();

                event.stopPropagation();
                event.preventDefault();
                return;
            }

            if (isKeybindingForEvent(event, KeyboardAction.autocompleteNextSuggestion)) {
                promptComponent.focusNextSuggestion();

                event.stopPropagation();
                event.preventDefault();
                return;
            }
        } else {
            if (isKeybindingForEvent(event, KeyboardAction.cliHistoryPrevious)) {
                promptComponent.scrollIntoView();
                promptComponent.setPreviousHistoryItem();

                event.stopPropagation();
                event.preventDefault();
                return;
            }

            if (isKeybindingForEvent(event, KeyboardAction.cliHistoryNext)) {
                promptComponent.scrollIntoView();
                promptComponent.setNextHistoryItem();

                event.stopPropagation();
                event.preventDefault();
                return;
            }
        }

        promptComponent.setPreviousKeyCode(event);
    }

    render() {
        let tabs: React.ReactElement<Props>[] | undefined;

        if (this.state.tabs.length > 1) {
            tabs = this.state.tabs.map((_tab: Tab, index: number) =>
                <TabHeaderComponent
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
            <div className="application" style={css.application()}>
                <div className="title-bar">
                    <ul style={css.tabs}>{tabs}</ul>
                    <SearchComponent/>
                </div>
                {this.state.tabs.map((tab, index) =>
                    <TabComponent tab={tab} isFocused={index === this.state.focusedTabIndex} key={index}/>)}
            </div>
        );
    }

    get focusedTab(): Tab {
        return this.state.tabs[this.state.focusedTabIndex];
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
