import {TabHeaderComponent, Props} from "./TabHeaderComponent";
import * as React from "react";
import {ipcRenderer} from "electron";
import {remote} from "electron";
import * as css from "./css/styles";
import {SearchComponent} from "./SearchComponent";
import {isMenuShortcut, isKeybindingForEvent} from "./keyevents/Keybindings";
import {KeyboardAction, Status} from "../Enums";
import {UserEvent} from "../Interfaces";
import {isModifierKey} from "./ViewUtils";
import {TabComponent} from "./TabComponent";
import {SessionID} from "../shell/Session";
import {services} from "../services";
import * as _ from "lodash";

type ApplicationState = {
    tabs: Array<{sessionIDs: SessionID[]; focusedSessionID: SessionID}>;
    focusedTabIndex: number;
};

export class ApplicationComponent extends React.Component<{}, ApplicationState> {
    tabComponents: TabComponent[];

    constructor(props: {}) {
        super(props);
        // Necessary because "remote" does not exist in electron-mocha tests
        services.window.onResize.subscribe(() => this.resizeAllSessions());

        if (remote) {
            const electronWindow = remote.BrowserWindow.getAllWindows()[0];

            ipcRenderer.on("change-working-directory", (_event: Event, directory: string) =>
                this.focusedSession.directory = directory,
            );

            services.font.changes.subscribe(() => {
                this.forceUpdate();
                this.resizeAllSessions();
            });

            services.sessions.onClose.subscribe(id => this.removeSessionFromState(id));

            window.onbeforeunload = () => {
                electronWindow
                    .removeAllListeners()
                    .webContents
                    .removeAllListeners("devtools-opened")
                    .removeAllListeners("devtools-closed")
                    .removeAllListeners("found-in-page");

                services.sessions.closeAll();
            };
        }

        const id = services.sessions.create();

        this.state = {
            tabs: [{
                sessionIDs: [id],
                focusedSessionID: id,
            }],
            focusedTabIndex: 0,
        };
    }

    render() {
        let tabs: React.ReactElement<Props>[] | undefined;

        if (this.state.tabs.length > 1) {
            tabs = this.state.tabs.map((_tab, index: number) =>
                <TabHeaderComponent
                    isFocused={index === this.state.focusedTabIndex}
                    key={index}
                    position={index + 1}
                    activate={() => this.setState({focusedTabIndex: index})}
                    closeHandler={(event: React.MouseEvent<HTMLSpanElement>) => {
                        services.sessions.close(this.state.tabs[index].sessionIDs);
                        event.stopPropagation();
                        event.preventDefault();
                    }}
                />,
            );
        }

        this.tabComponents = [];

        return (
            <div className="application" style={css.application()}>
                <div className="title-bar">
                    <ul className="tabs">{tabs}</ul>
                    <SearchComponent/>
                </div>
                {this.state.tabs.map((tabProps, index) =>
                    <TabComponent {...tabProps}
                                  isFocused={index === this.state.focusedTabIndex}
                                  key={index}
                                  onSessionFocus={(id: SessionID) => {
                                      const state = this.cloneState();
                                      state.tabs[state.focusedTabIndex].focusedSessionID = id;
                                      this.setState(state);
                                  }}
                                  ref={tabComponent => this.tabComponents[index] = tabComponent!}/>)}
            </div>
        );
    }

    /**
     * Tab methods.
     */

    get focusedTab() {
        return this.state.tabs[this.state.focusedTabIndex];
    }

    get focusedTabComponent() {
        return this.tabComponents[this.state.focusedTabIndex];
    }

    addTab(): void {
        if (this.state.tabs.length < 9) {
            const id = services.sessions.create();

            const state = this.cloneState();
            state.tabs.push({
                sessionIDs: [id],
                focusedSessionID: id,
            });
            state.focusedTabIndex = state.tabs.length - 1;

            this.setState(state);
        } else {
            remote.shell.beep();
        }
    }

    focusPreviousTab() {
        if (this.state.focusedTabIndex !== 0) {
            this.focusTab(this.state.focusedTabIndex - 1);
        }
    }

    focusNextTab() {
        if (this.state.focusedTabIndex !== this.state.tabs.length - 1) {
            this.focusTab(this.state.focusedTabIndex + 1);
        }
    }

    focusTab(index: number): void {
        if (index === 8) {
            index = this.state.tabs.length - 1;
        }

        if (this.state.tabs.length > index) {
            this.setState({focusedTabIndex: index});
        } else {
            remote.shell.beep();
        }
    }

    closeFocusedTab() {
        const sessionIDs = this.state.tabs[this.state.focusedTabIndex].sessionIDs;
        services.sessions.close(sessionIDs);
    }

    resizeFocusedTabSessions(): void {
        this.focusedTabComponent.sessionComponents.forEach(sessionComponent => sessionComponent.resizeSession());
    }

    resizeTabSessions(tabIndex: number): void {
        this.tabComponents[tabIndex].sessionComponents.forEach(sessionComponent => sessionComponent.resizeSession());
    }

    /**
     * Session methods.
     */

    get focusedSession() {
        return services.sessions.get(this.focusedTab.focusedSessionID);
    }

    otherSession(): void {
        const state = this.cloneState();
        const tabState = state.tabs[state.focusedTabIndex];

        if (this.focusedTab.sessionIDs.length < 2) {
            const id = services.sessions.create();
            tabState.sessionIDs.push(id);
            tabState.focusedSessionID = id;

            this.setState(state, () => this.resizeFocusedTabSessions());
        } else {
            tabState.focusedSessionID = tabState.sessionIDs.find(id => id !== tabState.focusedSessionID)!;
            this.setState(state);
        }
    }

    resizeAllSessions() {
        this.tabComponents.forEach(tabComponent => {
            tabComponent.sessionComponents.forEach(sessionComponent => sessionComponent.resizeSession());
        });
    }

    handleUserEvent(search: SearchComponent, event: UserEvent) {
        const sessionComponent = this.focusedTabComponent.focusedSessionComponent;
        if (!sessionComponent) {
            return;
        }

        const isJobRunning = sessionComponent.status === Status.InProgress;
        const promptComponent = sessionComponent.promptComponent;

        // Pasted data
        if (event instanceof ClipboardEvent) {
            if (search.isFocused) {
                return;
            }

            if (isJobRunning) {
                this.focusedSession.lastJob!.write(event.clipboardData.getData("text/plain"));
            } else {
                promptComponent.focus();
                document.execCommand("inserttext", false, event.clipboardData.getData("text/plain"));
            }

            event.stopPropagation();
            event.preventDefault();

            return;
        }

        if (isModifierKey(event) || isMenuShortcut(event)) {
            return;
        }

        // Close focused session
        if (!isJobRunning && isKeybindingForEvent(event, KeyboardAction.sessionClose)) {
            services.sessions.close(this.focusedSession.id);

            event.stopPropagation();
            event.preventDefault();
            return;
        }

        // Change focused tab
        if (isKeybindingForEvent(event, KeyboardAction.tabFocus)) {
            const position = parseInt(event.key, 10);
            this.focusTab(position - 1);

            event.stopPropagation();
            event.preventDefault();
            return;
        }

        // Console clear
        if (!isJobRunning && isKeybindingForEvent(event, KeyboardAction.cliClearJobs)) {
            this.focusedSession.clearJobs();

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

        if (isJobRunning && this.focusedSession.lastJob!.isRunningPty()) {
            this.focusedSession.lastJob!.write(event);

            event.stopPropagation();
            event.preventDefault();
            return;
        }

        if (isJobRunning) {
            return;
        }

        promptComponent.focus();

        // CLI execute command
        if (isKeybindingForEvent(event, KeyboardAction.cliRunCommand)) {
            promptComponent.execute((event.target as HTMLElement).innerText);

            event.stopPropagation();
            event.preventDefault();
            return;
        }

        // Append last argument to prompt
        if (isKeybindingForEvent(event, KeyboardAction.cliAppendLastArgumentOfPreviousCommand)) {
            promptComponent.appendLastLArgumentOfPreviousCommand();

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
                promptComponent.setPreviousHistoryItem();

                event.stopPropagation();
                event.preventDefault();
                return;
            }

            if (isKeybindingForEvent(event, KeyboardAction.cliHistoryNext)) {
                promptComponent.setNextHistoryItem();

                event.stopPropagation();
                event.preventDefault();
                return;
            }
        }

        promptComponent.setPreviousKeyCode(event);
    }

    private removeSessionFromState(id: SessionID) {
        const state = this.cloneState();
        const tabIndex = state.tabs.findIndex(tabState => tabState.sessionIDs.includes(id));
        const tabState = state.tabs[tabIndex];

        if (tabState.sessionIDs.length === 1) {
            this.removeTabFromState(tabIndex);
        } else {
            const sessionIndex = tabState.sessionIDs.findIndex(id => id === tabState.focusedSessionID);
            tabState.sessionIDs.splice(sessionIndex, 1);
            tabState.focusedSessionID = tabState.sessionIDs[0];

            this.setState(state, () => this.resizeTabSessions(tabIndex));
        }
    }

    private removeTabFromState(index: number): void {
        const state = this.cloneState();

        state.tabs.splice(index, 1);
        state.focusedTabIndex = Math.max(0, index - 1);

        if (state.tabs.length === 0) {
            ipcRenderer.send("quit");
        } else {
            this.setState(state);
        }
    }

    /**
     * Return a deep clone of the state in order not to
     * accidentally mutate it.
     */
    private cloneState(): ApplicationState {
        return _.cloneDeep(this.state);
    }
}
