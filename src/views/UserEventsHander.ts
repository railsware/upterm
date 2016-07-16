import {ApplicationComponent} from "./1_ApplicationComponent";
import {SessionComponent} from "./2_SessionComponent";
import {PromptComponent} from "./4_PromptComponent";
import {JobComponent} from "./3_JobComponent";
import {Tab} from "./TabComponent";
import {KeyCode, SplitDirection, Status} from "../Enums";
import {isModifierKey, keys} from "./ViewUtils";

export const handleUserEvent = (application: ApplicationComponent, tab: Tab, session: SessionComponent, job: JobComponent, prompt: PromptComponent) => (event: KeyboardEvent) => {
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

    if (isInProgress(job) && !isModifierKey(event)) {
        if (keys.interrupt(event)) {
            job.props.job.interrupt();
        } else {
            job.props.job.write(event);
        }

        event.stopPropagation();
        event.preventDefault();
        return;
    }

    prompt.focus();
};

function isInProgress(job: JobComponent): boolean {
    return job.props.job.status === Status.InProgress;
}
