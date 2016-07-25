import {ApplicationComponent} from "./1_ApplicationComponent";
import {SessionComponent} from "./2_SessionComponent";
import {PromptComponent} from "./4_PromptComponent";
import {JobComponent} from "./3_JobComponent";
import {Tab} from "./TabComponent";
import {KeyCode, SplitDirection, Status} from "../Enums";
import {isModifierKey} from "./ViewUtils";
import {SearchComponent} from "./SearchComponent";
import {remote} from "electron";

export type UserEvent = KeyboardEvent | ClipboardEvent;

export const handleUserEvent = (application: ApplicationComponent,
                                tab: Tab,
                                session: SessionComponent,
                                job: JobComponent,
                                prompt: PromptComponent,
                                search: SearchComponent) => (event: UserEvent) => {
    if (event instanceof ClipboardEvent) {
        if (search.isFocused) {
            return;
        }

        if (!isInProgress(job)) {
            prompt.focus();
            return;
        }

        job.props.job.write(event.clipboardData.getData("text/plain"));

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

const app = remote.app;
const browserWindow = remote.BrowserWindow.getAllWindows()[0];

if (process.platform === "darwin") {
    const template: Electron.MenuItemOptions[] = [
        {
            label: "Black Screen",
            submenu: [
                {
                    label: "About Black Screen",
                    role: "about",
                },
                {
                    type: "separator",
                },
                {
                    label: "Hide Black Screen",
                    accelerator: "Command+H",
                    click: () => {
                        app.hide();
                    },
                },
                {
                    label: "Hide Others",
                    accelerator: "Alt+Command+H",
                    role: "hideothers",
                },
                {
                    type: "separator",
                },
                {
                    label: "Quit",
                    accelerator: "Command+Q",
                    click: () => {
                        app.quit();
                    },
                },
            ],
        },
        {
            label: "Edit",
            submenu: [
                {
                    label: "Undo",
                    accelerator: "Command+Z",
                    role: "undo",
                },
                {
                    label: "Redo",
                    accelerator: "Shift+Command+Z",
                    role: "redo",
                },
                {
                    label: "Find",
                    accelerator: "Command+F",
                    click: () => {
                        (document.querySelector("input[type=search]") as HTMLInputElement).select();
                    },
                },
                {
                    type: "separator",
                },
                {
                    label: "Cut",
                    accelerator: "Command+X",
                    role: "cut",
                },
                {
                    label: "Copy",
                    accelerator: "Command+C",
                    role: "copy",
                },
                {
                    label: "Paste",
                    accelerator: "Command+V",
                    role: "paste",
                },
                {
                    label: "Select All",
                    accelerator: "Command+A",
                    role: "selectall",
                },
            ],
        },
        {
            label: "View",
            submenu: [
                {
                    label: "Reload",
                    accelerator: "Command+R",
                    click: () => {
                        browserWindow.reload();
                    },
                },
                {
                    label: "Toggle Full Screen",
                    accelerator: "Ctrl+Command+F",
                    click: () => {
                        browserWindow.setFullScreen(!browserWindow.isFullScreen());
                    },
                },
                {
                    label: "Toggle Developer Tools",
                    accelerator: "Alt+Command+I",
                    click: () => {
                        browserWindow.webContents.toggleDevTools();
                    },
                },
            ],
        },
        {
            label: "Window",
            submenu: [
                {
                    label: "Add Tab",
                    accelerator: "Command+t",
                    click: () => {
                        window.application.addTab();
                    },
                },
                {
                    label: "Split Horizontally",
                    accelerator: "Command+-",
                    click: () => {
                        window.focusedTab.addPane(SplitDirection.Horizontal);
                        window.application.forceUpdate();
                    },
                },
                {
                    label: "Split Vertically",
                    accelerator: "Command+\\",
                    click: () => {
                        window.focusedTab.addPane(SplitDirection.Vertical);
                        window.application.forceUpdate();
                    },
                },
            ],
        },
        {
            label: "Pane",
            submenu: [
                {
                    label: "Previous",
                    accelerator: "Command+k",
                    click: () => {
                        window.focusedTab.activatePreviousPane();
                        window.application.forceUpdate();
                    },
                },
                {
                    label: "Next",
                    accelerator: "Command+j",
                    click: () => {
                        window.focusedTab.activateNextPane();
                        window.application.forceUpdate();
                    },
                },
                {
                    label: "Close",
                    accelerator: "Command+w",
                    click: () => {
                        window.application.closeFocusedPane();
                        window.application.forceUpdate();
                    },
                },
            ],
        },
        {
            label: "Help",
            submenu: [
                {
                    label: "GitHub Repository",
                    click: () => {
                        /* tslint:disable:no-unused-expression */
                        remote.shell.openExternal("https://github.com/shockone/black-screen");
                    },
                },
            ],
        },
    ];

    remote.Menu.setApplicationMenu(remote.Menu.buildFromTemplate(template));
}
