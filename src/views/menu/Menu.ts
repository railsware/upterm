import {KeyboardAction} from "../../Enums";
import {remote} from "electron";
import {getAcceleratorForAction} from "../keyevents/Keybindings";
import {ApplicationComponent} from "../ApplicationComponent";
import {services} from "../../services";

export function buildMenuTemplate(
    app: Electron.App,
    browserWindow: Electron.BrowserWindow,
    application: ApplicationComponent,
): Electron.MenuItemConstructorOptions[] {
    return [
        {
            label: "Upterm",
            submenu: [
                {role: "about"},
                {
                    label: "Quit",
                    accelerator: getAcceleratorForAction(KeyboardAction.uptermQuit),
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
                    label: "Copy",
                    accelerator: getAcceleratorForAction(KeyboardAction.clipboardCopy),
                    role: "copy",
                },
                {
                    label: "Paste",
                    accelerator: getAcceleratorForAction(KeyboardAction.clipboardPaste),
                    role: "paste",
                },
                {
                    label: "Find",
                    accelerator: getAcceleratorForAction(KeyboardAction.editFind),
                    click: () => {
                        (document.querySelector("input[type=search]") as HTMLInputElement).select();
                    },
                },
                {
                    type: "separator",
                },
                {
                    label: "Increase Font Size",
                    accelerator: getAcceleratorForAction(KeyboardAction.increaseFontSize),
                    click: () => {
                        services.font.increaseSize();
                    },
                },
                {
                    label: "Decrease Font Size",
                    accelerator: getAcceleratorForAction(KeyboardAction.decreaseFontSize),
                    click: () => {
                        services.font.decreaseSize();
                    },
                },
                {
                    label: "Reset Font Size",
                    accelerator: getAcceleratorForAction(KeyboardAction.resetFontSize),
                    click: () => {
                        services.font.resetSize();
                    },
                },
            ],
        },
        {
            label: "View",
            submenu: [
                {
                    label: "Toggle Full Screen",
                    accelerator: getAcceleratorForAction(KeyboardAction.viewToggleFullScreen),
                    click: () => {
                        browserWindow.setFullScreen(!browserWindow.isFullScreen());
                    },
                },
                {
                    label: "Toggle Developer Tools",
                    accelerator: getAcceleratorForAction(KeyboardAction.toggleDeveloperTools),
                    click: () => {
                        browserWindow.webContents.toggleDevTools();
                    },
                },
            ],
        },
        {
            label: "Session",
            submenu: [
                {
                    label: "Other Session",
                    accelerator: getAcceleratorForAction(KeyboardAction.otherSession),
                    click: () => {
                        application.otherSession();
                    },
                },
                {
                    label: "Close Current Session",
                    accelerator: getAcceleratorForAction(KeyboardAction.sessionClose),
                    click: () => {
                        application.closeFocusedSession();
                    },
                },
            ],
        },
        {
            label: "Tab",
            submenu: [
                {
                    label: "New Tab",
                    accelerator: getAcceleratorForAction(KeyboardAction.tabNew),
                    click: () => {
                        application.addTab();
                    },
                },
                {
                    type: "separator",
                },
                {
                    label: "Previous Tab",
                    accelerator: getAcceleratorForAction(KeyboardAction.tabPrevious),
                    click: () => {
                        application.focusPreviousTab();
                    },
                },
                {
                    label: "Next Tab",
                    accelerator: getAcceleratorForAction(KeyboardAction.tabNext),
                    click: () => {
                        application.focusNextTab();
                    },
                },
                {
                    type: "separator",
                },
                {
                    label: "Close Current Tab",
                    click: () => {
                        application.closeFocusedTab();
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
                        remote.shell.openExternal("http://l.rw.rw/upterm_repository");
                    },
                },
                {
                    label: "Leave Feedback",
                    click: () => {
                        /* tslint:disable:no-unused-expression */
                        remote.shell.openExternal("http://l.rw.rw/upterm_leave_feedback");
                    },
                },
            ],
        },
    ];
}
