import {ApplicationComponent} from "./1_ApplicationComponent";
import {SessionComponent} from "./2_SessionComponent";
import {PromptComponent} from "./4_PromptComponent";
import {JobComponent} from "./3_JobComponent";
import {Tab} from "./TabComponent";
import {KeyCode, SplitDirection, Status} from "../Enums";

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

    if (event.ctrlKey && event.keyCode === KeyCode.D) {
        const focusedSession = tab.focusedPane.session;

        if (focusedSession.currentJob.status !== Status.InProgress) {
            application.closeFocusedPane();

            application.forceUpdate();

            event.stopPropagation();
            event.preventDefault();
            return;
        }
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
};
