import {KeyboardAction, SplitDirection} from "../../Enums";
import {remote} from "electron";
import {getAcceleratorForAction} from "../keyevents/Keybindings";
import {ApplicationComponent} from "../1_ApplicationComponent";

export function buildMenuTemplate(
    app: Electron.App,
    browserWindow: Electron.BrowserWindow,
    application: ApplicationComponent,
): Electron.MenuItemOptions[] {
    const template: Electron.MenuItemOptions[] = [
        {
            label: "Upterm",
            submenu: [
                {
                    label: "About Upterm",
                    role: "about",
                },
                {
                    type: "separator",
                },
                {
                    label: "Hide Upterm",
                    accelerator: getAcceleratorForAction(KeyboardAction.uptermHide),
                    click: () => {
                        app.hide();
                    },
                },
                {
                    label: "Hide Others",
                    accelerator: getAcceleratorForAction(KeyboardAction.uptermHideOthers),
                    role: "hideothers",
                },
                {
                    type: "separator",
                },
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
            ],
        },
        {
            label: "View",
            submenu: [
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
                        application.activatePreviousTab();
                        application.forceUpdate();
                    },
                },
                {
                    label: "Next",
                    accelerator: getAcceleratorForAction(KeyboardAction.tabNext),
                    click: () => {
                        application.activateNextTab();
                        application.forceUpdate();
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
                        application.forceUpdate();
                    },
                },
            ],
        },
        {
            label: "Pane",
            submenu: [
                {
                    label: "Split Horizontally",
                    accelerator: getAcceleratorForAction(KeyboardAction.paneSplitHorizontally),
                    click: () => {
                        application.focusedTab().addPane(SplitDirection.Horizontal);
                        application.forceUpdate();
                    },
                },
                {
                    label: "Split Vertically",
                    accelerator: getAcceleratorForAction(KeyboardAction.paneSplitVertically),
                    click: () => {
                        application.focusedTab().addPane(SplitDirection.Vertical);
                        application.forceUpdate();
                    },
                },
                {
                    type: "separator",
                },
                {
                    label: "Previous",
                    accelerator: getAcceleratorForAction(KeyboardAction.panePrevious),
                    click: () => {
                        application.focusedTab().activatePreviousPane();
                        application.forceUpdate();
                    },
                },
                {
                    label: "Next",
                    accelerator: getAcceleratorForAction(KeyboardAction.paneNext),
                    click: () => {
                        application.focusedTab().activateNextPane();
                        application.forceUpdate();
                    },
                },
                {
                    type: "separator",
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
