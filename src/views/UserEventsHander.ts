import {ApplicationComponent} from "./1_ApplicationComponent";
import {SessionComponent} from "./2_SessionComponent";
import {PromptComponent} from "./4_PromptComponent";
import {JobComponent} from "./3_JobComponent";
import {Tab} from "./TabComponent";
import {KeyCode, SplitDirection, Status} from "../Enums";
import {isModifierKey} from "./ViewUtils";
import {SearchComponent} from "./SearchComponent";

export const handleUserEvent = (application: ApplicationComponent,
                                tab: Tab,
                                session: SessionComponent,
                                job: JobComponent,
                                prompt: PromptComponent,
                                search: SearchComponent) => (event: KeyboardEvent) => {
    if (event.metaKey && event.keyCode === KeyCode.F) {
        (document.querySelector("input[type=search]") as HTMLInputElement).select();
    }

    if (event.metaKey && event.keyCode === KeyCode.Underscore) {
        tab.addPane(SplitDirection.Horizontal);
        application.forceUpdate();

        event.stopPropagation();
        event.preventDefault();
        return;
    }

    if (event.metaKey && event.keyCode === KeyCode.VerticalBar) {
        tab.addPane(SplitDirection.Vertical);
        application.forceUpdate();

        event.stopPropagation();
        event.preventDefault();
        return;
    }

    if (event.ctrlKey && event.keyCode === KeyCode.D && !isInProgress(job)) {
        application.closeFocusedPane();

        application.forceUpdate();

        event.stopPropagation();
        event.preventDefault();
        return;
    }

    if (event.metaKey && event.keyCode === KeyCode.W) {
        application.closeFocusedPane();

        application.forceUpdate();

        event.stopPropagation();
        event.preventDefault();
        return;
    }

    if (event.metaKey && event.keyCode === KeyCode.J) {
        tab.activateNextPane();

        application.forceUpdate();

        event.stopPropagation();
        event.preventDefault();
        return;
    }

    if (event.metaKey && event.keyCode === KeyCode.K) {
        tab.activatePreviousPane();

        application.forceUpdate();

        event.stopPropagation();
        event.preventDefault();
        return;
    }

    if (event.metaKey && event.keyCode === KeyCode.T) {
        application.addTab();

        event.stopPropagation();
        event.preventDefault();
        return;
    }

    if (event.metaKey && event.keyCode >= KeyCode.One && event.keyCode <= KeyCode.Nine) {
        const position = parseInt(event.key, 10);
        application.focusTab(position);

        event.stopPropagation();
        event.preventDefault();
        return;
    }

    if (event.metaKey && event.keyCode === KeyCode.D) {
        window.DEBUG = !window.DEBUG;

        require("devtron").install();
        console.log(`Debugging mode has been ${window.DEBUG ? "enabled" : "disabled"}.`);

        application.forceUpdate();

        event.stopPropagation();
        event.preventDefault();
        return;
    }

    if (event.ctrlKey && event.keyCode === KeyCode.L && !isInProgress(job)) {
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
        if (event.keyCode === KeyCode.Escape) {
            search.clearSelection();
            setTimeout(() => prompt.focus(), 0);

            event.stopPropagation();
            event.preventDefault();
            return;
        }

        return;
    }

    if (isInProgress(job) && !isModifierKey(event)) {
        if (event.ctrlKey && event.keyCode === KeyCode.C) {
            job.props.job.interrupt();
        } else {
            job.props.job.write(event);
        }

        event.stopPropagation();
        event.preventDefault();
        return;
    }

    prompt.focus();

    if (event.keyCode === KeyCode.Period && event.altKey) {
        prompt.appendLastLArgumentOfPreviousCommand();

        event.stopPropagation();
        event.preventDefault();
        return;
    }

    if (!isInProgress(job)) {
        if (event.ctrlKey && event.keyCode === KeyCode.W) {
            prompt.deleteWord();

            event.stopPropagation();
            event.preventDefault();
            return;
        }

        if (event.keyCode === KeyCode.CarriageReturn) {
            prompt.execute((event.target as HTMLElement).innerText);

            event.stopPropagation();
            event.preventDefault();
            return;
        }

        if (event.ctrlKey && event.keyCode === KeyCode.C) {
            prompt.clear();

            event.stopPropagation();
            event.preventDefault();
            return;
        }

        if (prompt.isAutocompleteShown()) {
            if (event.keyCode === KeyCode.Tab) {
                prompt.applySuggestion();

                event.stopPropagation();
                event.preventDefault();
                return;
            }

            if ((event.ctrlKey && event.keyCode === KeyCode.P) || event.keyCode === KeyCode.Up) {
                prompt.focusPreviousSuggestion();

                event.stopPropagation();
                event.preventDefault();
                return;
            }

            if ((event.ctrlKey && event.keyCode === KeyCode.N) || event.keyCode === KeyCode.Down) {
                prompt.focusNextSuggestion();

                event.stopPropagation();
                event.preventDefault();
                return;
            }
        } else {
            if ((event.ctrlKey && event.keyCode === KeyCode.P) || event.keyCode === KeyCode.Up) {
                prompt.setPreviousHistoryItem();

                event.stopPropagation();
                event.preventDefault();
                return;
            }

            if ((event.ctrlKey && event.keyCode === KeyCode.N) || event.keyCode === KeyCode.Down) {
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
