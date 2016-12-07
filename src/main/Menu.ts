import {KeyboardAction} from "../Enums";
import {shell} from "electron";
import {getAcceleratorForAction} from "../Keybindings";
import {createWindow} from "./Main";


export function buildMenuTemplate(app: Electron.App): Electron.MenuItemOptions[] {
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
                    accelerator: getAcceleratorForAction(KeyboardAction.blackScreenHide),
                    click: () => {
                        app.hide();
                    },
                },
                {
                    label: "Hide Others",
                    accelerator: getAcceleratorForAction(KeyboardAction.blackScreenHideOthers),
                    role: "hideothers",
                },
                {
                    type: "separator",
                },
                {
                    label: "Quit",
                    accelerator: getAcceleratorForAction(KeyboardAction.blackScreenQuit),
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
            ],
        },
        {
            label: "View",
            submenu: [
                {
                    label: "Reload",
                    accelerator: getAcceleratorForAction(KeyboardAction.viewReload),
                    click: (_item, browserWindow) => {
                        if (browserWindow) {
                            browserWindow.reload();
                        }
                    },
                },
                {
                    label: "Toggle Full Screen",
                    accelerator: getAcceleratorForAction(KeyboardAction.viewToggleFullScreen),
                    click: (_item, browserWindow) => {
                        if (browserWindow) {
                            browserWindow.setFullScreen(!browserWindow.isFullScreen());
                        }
                    },
                },
                {
                    label: "Toggle Developer Tools",
                    accelerator: getAcceleratorForAction(KeyboardAction.developerToggleTools),
                    click: (_item, browserWindow) => {
                        if (browserWindow) {
                            browserWindow.webContents.toggleDevTools();
                        }
                    },
                },
            ],
        },
        {
            label: "Window",
            submenu: [
                {
                    label: "New Window",
                    accelerator: getAcceleratorForAction(KeyboardAction.windowNew),
                    click: () => {
                        createWindow();
                    },
                },
                {
                    type: "separator",
                },
                {
                    label: "Close Window",
                    accelerator: getAcceleratorForAction(KeyboardAction.windowClose),
                    click: (_item, browserWindow) => {
                        if (browserWindow) {
                            browserWindow.close();
                        }
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
                    click: (_item, browserWindow) => {
                        if (browserWindow) {
                            browserWindow.webContents.send("add-tab");
                        }
                    },
                },
                {
                    type: "separator",
                },
                {
                    label: "Previous",
                    accelerator: getAcceleratorForAction(KeyboardAction.tabPrevious),
                    click: (_item, browserWindow) => {
                        if (browserWindow) {
                            browserWindow.webContents.send("activate-previous-tab");
                        }
                    },
                },
                {
                    label: "Next",
                    accelerator: getAcceleratorForAction(KeyboardAction.tabNext),
                    click: (_item, browserWindow) => {
                        if (browserWindow) {
                            browserWindow.webContents.send("activate-next-tab");
                        }
                    },
                },
                {
                    type: "separator",
                },
                {
                    label: "Close",
                    accelerator: getAcceleratorForAction(KeyboardAction.tabClose),
                    click: (_item, browserWindow) => {
                        if (browserWindow) {
                            browserWindow.webContents.send("close-focused-tab");
                        }
                    },
                },
            ],
        },
        {
            label: "Pane",
            submenu: [
                {
                    label: "Split Horizontally",
                    accelerator: getAcceleratorForAction(KeyboardAction.windowSplitHorizontally),
                    click: (_item, browserWindow) => {
                        if (browserWindow) {
                            browserWindow.webContents.send("split-horizontally");
                        }
                    },
                },
                {
                    label: "Split Vertically",
                    accelerator: getAcceleratorForAction(KeyboardAction.windowSplitVertically),
                    click: (_item, browserWindow) => {
                        if (browserWindow) {
                            browserWindow.webContents.send("split-vertically");
                        }
                    },
                },
                {
                    type: "separator",
                },
                {
                    label: "Previous",
                    accelerator: getAcceleratorForAction(KeyboardAction.panePrevious),
                    click: (_item, browserWindow) => {
                        if (browserWindow) {
                            browserWindow.webContents.send("activate-previous-pane");
                        }
                    },
                },
                {
                    label: "Next",
                    accelerator: getAcceleratorForAction(KeyboardAction.paneNext),
                    click: (_item, browserWindow) => {
                        if (browserWindow) {
                            browserWindow.webContents.send("activate-next-pane");
                        }
                    },
                },
                {
                    type: "separator",
                },
                {
                    label: "Close",
                    accelerator: getAcceleratorForAction(KeyboardAction.paneClose),
                    click: (_item, browserWindow) => {
                        if (browserWindow) {
                            browserWindow.webContents.send("close-focused-pane");
                        }
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
                        shell.openExternal("https://github.com/shockone/black-screen");
                    },
                },
            ],
        },
    ];
    return template;
}
