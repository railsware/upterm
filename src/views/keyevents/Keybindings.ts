import {KeyCode, KeyboardAction} from "../../Enums";
import {error} from "../../utils/Common";

export type KeybindingType = {
    action: KeyboardAction,
    keybinding: (e: KeyboardEvent) => boolean,
};

function isMeta(e: KeyboardEvent): boolean {
    /**
     * Decides if a keyboard event contains the meta key for all platforms
     * Linux does not support the metaKey so it can be manually changed here
     * Windows/OSX is simply e.metaKey
     */
    if (e.metaKey) {
        return true;
    } else if (process.platform === "linux") {
        return e.ctrlKey;
    }
    return false;
}

export const KeybindingsForActions: KeybindingType[] = [
    // CLI commands
    {
        action: KeyboardAction.cliRunCommand,
        keybinding: (e: KeyboardEvent) => e.keyCode === KeyCode.CarriageReturn,
    },
    {
        action: KeyboardAction.cliClearJobs,
        keybinding: (e: KeyboardEvent) => e.ctrlKey && e.keyCode === KeyCode.L,
    },
    {
        action: KeyboardAction.cliClearText,
        // Need to include !shiftKey otherwise it will clear instead of copying
        keybinding: (e: KeyboardEvent) => e.ctrlKey && e.keyCode === KeyCode.C && !e.shiftKey,
    },
    {
        action: KeyboardAction.cliAppendLastArgumentOfPreviousCommand,
        keybinding: (e: KeyboardEvent) => e.altKey && e.keyCode === KeyCode.Period,
    },
    {
        action: KeyboardAction.cliHistoryPrevious,
        keybinding: (e: KeyboardEvent) => {
            return (e.ctrlKey && e.keyCode === KeyCode.P) || (e.keyCode === KeyCode.Up);
        },
    },
    {
        action: KeyboardAction.cliHistoryNext,
        keybinding: (e: KeyboardEvent) => {
            return (e.ctrlKey && e.keyCode === KeyCode.N) || (e.keyCode === KeyCode.Down);
        },
    },
    // autocomplete commands
    {
        action: KeyboardAction.autocompleteInsertCompletion,
        keybinding: (e: KeyboardEvent) => e.keyCode === KeyCode.Tab,
    },
    {
        action: KeyboardAction.autocompletePreviousSuggestion,
        keybinding: (e: KeyboardEvent) => {
            return (e.ctrlKey && e.keyCode === KeyCode.P) || (e.keyCode === KeyCode.Up);
        },
    },
    {
        action: KeyboardAction.autocompleteNextSuggestion,
        keybinding: (e: KeyboardEvent) => {
            return (e.ctrlKey && e.keyCode === KeyCode.N) || (e.keyCode === KeyCode.Down);
        },
    },
    // pane command
    {
        action: KeyboardAction.paneClose,
        keybinding: (e: KeyboardEvent) => isMeta(e) && e.keyCode === KeyCode.D,
    },
    // tab commands
    {
        action: KeyboardAction.tabFocus,
        keybinding: (e: KeyboardEvent) => {
            return ((e.ctrlKey || isMeta(e)) && e.keyCode >= KeyCode.One && e.keyCode <= KeyCode.Nine);
        },
    },
    // search commands
    {
        action: KeyboardAction.editFindClose,
        keybinding: (e: KeyboardEvent) => e.keyCode === KeyCode.Escape,
    },
];

export function isKeybindingForEvent(event: KeyboardEvent, action: KeyboardAction): boolean {
    /**
     * Finds the keybinding for the given action and returns the result of the keybinding function
     */
    let matchingKeyboardAction = KeybindingsForActions.find((keybinding) => {
        return keybinding.action === action;
    });
    if (!matchingKeyboardAction) {
        error("No matching keybinding for action: " + KeyboardAction[action]);
        return false;
    }
    return matchingKeyboardAction.keybinding(event);
}

// Menu Stuff
export type KeybindingMenuType = {
    action: KeyboardAction,
    accelerator: string,
};

const CmdOrCtrl = process.platform === "darwin" ? "Cmd" : "Ctrl";

export const KeybindingsForMenu: KeybindingMenuType[] = [
    {
        action: KeyboardAction.tabNew,
        accelerator: `${CmdOrCtrl}+T`,
    },
    {
        action: KeyboardAction.tabPrevious,
        accelerator: `${CmdOrCtrl}+]`,
    },
    {
        action: KeyboardAction.tabNext,
        accelerator: `${CmdOrCtrl}+[`,
    },
    {
        action: KeyboardAction.tabClose,
        accelerator: `${CmdOrCtrl}+W`,
    },
    // pane commands
    {
        action: KeyboardAction.paneSplitHorizontally,
        accelerator: `Alt+-`,
    },
    {
        action: KeyboardAction.paneSplitVertically,
        accelerator: `Alt+\\`,
    },
    {
        action: KeyboardAction.panePrevious,
        accelerator: `Alt+[`,
    },
    {
        action: KeyboardAction.paneNext,
        accelerator: `Alt+]`,
    },
    // edit/clipboard commands
    {
        action: KeyboardAction.clipboardCopy,
        accelerator: process.platform === "darwin" ? "Command+C" : "Ctrl+Shift+C",
    },
    {
        action: KeyboardAction.clipboardCut,
        accelerator: `${CmdOrCtrl}+X`,
    },
    {
        action: KeyboardAction.clipboardPaste,
        accelerator: `${CmdOrCtrl}+V`,
    },
    {
        action: KeyboardAction.editUndo,
        accelerator: `${CmdOrCtrl}+Z`,
    },
    {
        action: KeyboardAction.editRedo,
        accelerator: `${CmdOrCtrl}+Shift+Z`,
    },
    {
        action: KeyboardAction.editSelectAll,
        accelerator: `${CmdOrCtrl}+A`,
    },
    {
        action: KeyboardAction.editFind,
        accelerator: `${CmdOrCtrl}+F`,
    },
    {
        action: KeyboardAction.editFindClose,
        accelerator: "Esc",
    },
    // view commands
    {
        action: KeyboardAction.viewReload,
        accelerator: `${CmdOrCtrl}+Shift+R`,
    },
    {
        action: KeyboardAction.viewToggleFullScreen,
        accelerator: "Ctrl+Shift+F",
    },
    // Upterm commands
    {
        action: KeyboardAction.uptermHide,
        accelerator: `${CmdOrCtrl}+H`,
    },
    {
        action: KeyboardAction.uptermQuit,
        accelerator: `${CmdOrCtrl}+Q`,
    },
    {
        action: KeyboardAction.uptermHideOthers,
        accelerator: `${CmdOrCtrl}+Alt+H`,
    },
    // developer
    {
        action: KeyboardAction.developerToggleTools,
        accelerator: `${CmdOrCtrl}+Alt+I`,
    },
    {
        action: KeyboardAction.developerToggleDebugMode,
        accelerator: `${CmdOrCtrl}+Shift+D`,
    },
];


export function getAcceleratorForAction(action: KeyboardAction): string {
    /**
     * Returns the accelerator for a given keyboard action
     */
    // Find the matching menu item by keyboardAction (should only ever return one item)
    let matchingMenuItem = KeybindingsForMenu.filter((menuAction) => {
        return menuAction.action === action;
    })[0];
    return matchingMenuItem.accelerator;
}

export function isMenuShortcut(event: KeyboardEvent): boolean {
    const accelerator = toAccelerator(event);
    return !!KeybindingsForMenu.find(action => action.accelerator === accelerator);
}

function toAccelerator(event: KeyboardEvent): string {
    let parts: string[] = [];

    if (event.ctrlKey) {
        parts.push("Ctrl");
    }

    if (event.shiftKey) {
        parts.push("Shift");
    }

    if (event.metaKey) {
        parts.push("Cmd");
    }

    if (event.altKey) {
        parts.push("Alt");
    }

    parts.push(event.key.toUpperCase());

    return parts.join("+");
}
