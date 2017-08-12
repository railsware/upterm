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
    const template: Electron.MenuItemConstructorOptions[] = [
        {
            label: "Upterm",
            submenu: [
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
                    label: "Undo",
                    accelerator: getAcceleratorForAction(KeyboardAction.editUndo),
                    role: "undo",
                },
                {
                    label: "Redo",
                    accelerator: getAcceleratorForAction(KeyboardAction.editRedo),
                    role: "redo",
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
                    label: "Cut",
                    accelerator: getAcceleratorForAction(KeyboardAction.clipboardCut),
                    role: "cut",
                },
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
                    label: "Select All",
                    accelerator: getAcceleratorForAction(KeyboardAction.editSelectAll),
                    role: "selectall",
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
                    label: "Other Session",
                    accelerator: getAcceleratorForAction(KeyboardAction.otherSession),
                    click: () => {
                        application.otherSession();
                    },
                },
                {
                    label: "Reload",
                    accelerator: getAcceleratorForAction(KeyboardAction.viewReload),
                    click: () => {
                        browserWindow.reload();
                    },
                },
                {
                    label: "Toggle Full Screen",
                    accelerator: getAcceleratorForAction(KeyboardAction.viewToggleFullScreen),
                    click: () => {
                        browserWindow.setFullScreen(!browserWindow.isFullScreen());
                    },
                },
                {
                    label: "Toggle Developer Tools",
                    accelerator: getAcceleratorForAction(KeyboardAction.developerToggleTools),
                    click: () => {
                        browserWindow.webContents.toggleDevTools();
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
                    label: "Previous",
                    accelerator: getAcceleratorForAction(KeyboardAction.tabPrevious),
                    click: () => {
                        application.focusPreviousTab();
                    },
                },
                {
                    label: "Next",
                    accelerator: getAcceleratorForAction(KeyboardAction.tabNext),
                    click: () => {
                        application.focusNextTab();
                    },
                },
                {
                    type: "separator",
                },
                {
                    label: "Close",
                    accelerator: getAcceleratorForAction(KeyboardAction.tabClose),
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
                        remote.shell.openExternal("https://github.com/railsware/upterm");
                    },
                },
            ],
        },
    ];
    return template;
}
