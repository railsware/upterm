import {KeyboardAction, SplitDirection} from "../../Enums";
import {remote} from "electron";
import {getAccleratorForAction} from "../keyevents/Keybindings";



export function buildMenuTemplate(app: Electron.App, browserWindow: Electron.BrowserWindow): Electron.MenuItemOptions[] {
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
                    accelerator: getAccleratorForAction(KeyboardAction.blackScreenHide),
                    click: () => {
                        app.hide();
                    },
                },
                {
                    label: "Hide Others",
                    accelerator: getAccleratorForAction(KeyboardAction.blackScreenHideOthers),
                    role: "hideothers",
                },
                {
                    type: "separator",
                },
                {
                    label: "Quit",
                    accelerator: getAccleratorForAction(KeyboardAction.blackScreenQuit),
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
                    accelerator: getAccleratorForAction(KeyboardAction.editUndo),
                    role: "undo",
                },
                {
                    label: "Redo",
                    accelerator: getAccleratorForAction(KeyboardAction.editRedo),
                    role: "redo",
                },
                {
                    label: "Find",
                    accelerator: getAccleratorForAction(KeyboardAction.editFind),
                    click: () => {
                        (document.querySelector("input[type=search]") as HTMLInputElement).select();
                    },
                },
                {
                    type: "separator",
                },
                {
                    label: "Cut",
                    accelerator: getAccleratorForAction(KeyboardAction.clipboardCut),
                    role: "cut",
                },
                {
                    label: "Copy",
                    accelerator: getAccleratorForAction(KeyboardAction.clipboardCopy),
                    role: "copy",
                },
                {
                    label: "Paste",
                    accelerator: getAccleratorForAction(KeyboardAction.clipboardPaste),
                    role: "paste",
                },
                {
                    label: "Select All",
                    accelerator: getAccleratorForAction(KeyboardAction.editSelectAll),
                    role: "selectall",
                },
            ],
        },
        {
            label: "View",
            submenu: [
                {
                    label: "Reload",
                    accelerator: getAccleratorForAction(KeyboardAction.viewReload),
                    click: () => {
                        browserWindow.reload();
                    },
                },
                {
                    label: "Toggle Full Screen",
                    accelerator: getAccleratorForAction(KeyboardAction.viewToggleFullScreen),
                    click: () => {
                        browserWindow.setFullScreen(!browserWindow.isFullScreen());
                    },
                },
                {
                    label: "Toggle Developer Tools",
                    accelerator: getAccleratorForAction(KeyboardAction.developerToggleTools),
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
                    accelerator: getAccleratorForAction(KeyboardAction.tabNew),
                    click: () => {
                        window.application.addTab();
                    },
                },
                {
                    label: "Split Horizontally",
                    accelerator: getAccleratorForAction(KeyboardAction.windowSplitHorizontally),
                    click: () => {
                        window.focusedTab.addPane(SplitDirection.Horizontal);
                        window.application.forceUpdate();
                    },
                },
                {
                    label: "Split Vertically",
                    accelerator: getAccleratorForAction(KeyboardAction.windowSplitVertically),
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
                    accelerator: getAccleratorForAction(KeyboardAction.tabPrevious),
                    click: () => {
                        window.focusedTab.activatePreviousPane();
                        window.application.forceUpdate();
                    },
                },
                {
                    label: "Next",
                    accelerator: getAccleratorForAction(KeyboardAction.tabNext),
                    click: () => {
                        window.focusedTab.activateNextPane();
                        window.application.forceUpdate();
                    },
                },
                {
                    label: "Close",
                    accelerator: getAccleratorForAction(KeyboardAction.tabClose),
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
    return template;
}
