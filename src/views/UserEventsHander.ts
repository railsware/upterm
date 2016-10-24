import {ApplicationComponent} from "./1_ApplicationComponent";
import {SessionComponent} from "./2_SessionComponent";
import {PromptComponent} from "./4_PromptComponent";
import {JobComponent} from "./3_JobComponent";
import {Tab} from "./TabComponent";
import {Status, KeyboardAction} from "../Enums";
import {isModifierKey} from "./ViewUtils";
import {SearchComponent} from "./SearchComponent";
import {remote} from "electron";
import {buildMenuTemplate} from "./menu/Menu";
import {isKeybindingForEvent} from "./keyevents/Keybindings";

export type UserEvent = KeyboardEvent | ClipboardEvent;

export const handleUserEvent = (
    application: ApplicationComponent,
    tab: Tab,
    session: SessionComponent,
    job: JobComponent,
    prompt: PromptComponent,
    search: SearchComponent
) => (event: UserEvent) => {
    if (event instanceof ClipboardEvent) {
        if (search.isFocused) {
            return;
        }

        if (!isInProgress(job)) {
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
    if (isKeybindingForEvent(event, KeyboardAction.paneClose) && !isInProgress(job)) {
        application.closeFocusedPane();

        application.forceUpdate();

        event.stopPropagation();
        event.preventDefault();
        return;
    }

    // Change tab action
    if (isKeybindingForEvent(event, KeyboardAction.tabFocus)) {
        const position = parseInt(event.key, 10);
        application.focusTab(position);

        event.stopPropagation();
        event.preventDefault();
        return;
    }

    // Enable debug mode
    if (isKeybindingForEvent(event, KeyboardAction.developerToggleDebugMode)) {
        window.DEBUG = !window.DEBUG;

        require("devtron").install();
        console.log(`Debugging mode has been ${window.DEBUG ? "enabled" : "disabled"}.`);

        application.forceUpdate();

        event.stopPropagation();
        event.preventDefault();
        return;
    }

    // Console clear
    if (isKeybindingForEvent(event, KeyboardAction.cliClearJobs) && !isInProgress(job)) {
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


    if (isInProgress(job) && !isModifierKey(event)) {
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

    if (!isInProgress(job)) {
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
                prompt.setPreviousHistoryItem();

                event.stopPropagation();
                event.preventDefault();
                return;
            }

            if (isKeybindingForEvent(event, KeyboardAction.cliHistoryNext)) {
                prompt.setNextHistoryItem();

                event.stopPropagation();
                event.preventDefault();
                return;
            }
        }
    }

    prompt.setPreviousKeyCode(event);
};

function isInProgress(job: JobComponent): boolean {
    return job.props.job.status === Status.InProgress;
}

const app = remote.app;
const browserWindow = remote.BrowserWindow.getAllWindows()[0];
const template = buildMenuTemplate(app, browserWindow);

remote.Menu.setApplicationMenu(remote.Menu.buildFromTemplate(template));
