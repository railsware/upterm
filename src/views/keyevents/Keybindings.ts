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
        action: KeyboardAction.cliInterrupt,
        keybinding: (e: KeyboardEvent) => e.ctrlKey && e.keyCode === KeyCode.C,
    },
    {
        action: KeyboardAction.cliClearJobs,
        keybinding: (e: KeyboardEvent) => e.ctrlKey && e.keyCode === KeyCode.L,
    },
    {
        action: KeyboardAction.cliDeleteWord,
        keybinding: (e: KeyboardEvent) => e.ctrlKey && e.keyCode === KeyCode.W,
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
    // tab commands
    {
        action: KeyboardAction.tabClose,
        keybinding: (e: KeyboardEvent) => isMeta(e) && e.keyCode === KeyCode.D,
    },
    {
        action: KeyboardAction.tabFocus,
        keybinding: (e: KeyboardEvent) => {
            return (e.ctrlKey && e.keyCode >= KeyCode.One && e.keyCode <= KeyCode.Nine);
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

const CopyAccelerator = process.platform === "darwin" ? "Command+C" : "Ctrl+Shift+C";
const ToggleFullScreenAccelerator = process.platform === "darwin" ? "Command+F" : "Ctrl+Shift+F";

export const KeybindingsForMenu: KeybindingMenuType[] = [
    {
        action: KeyboardAction.tabNew,
        accelerator: "CmdOrCtrl+T",
    },
    {
        action: KeyboardAction.tabPrevious,
        accelerator: "CmdOrCtrl+K",
    },
    {
        action: KeyboardAction.tabNext,
        accelerator: "CmdOrCtrl+J",
    },
    {
        action: KeyboardAction.tabClose,
        accelerator: "CmdOrCtrl+W",
    },
    // edit/clipboard commands
    {
        action: KeyboardAction.clipboardCopy,
        accelerator: CopyAccelerator,
    },
    {
        action: KeyboardAction.clipboardCut,
        accelerator: "CmdOrCtrl+X",
    },
    {
        action: KeyboardAction.clipboardPaste,
        accelerator: "CmdOrCtrl+V",
    },
    {
        action: KeyboardAction.editUndo,
        accelerator: "CmdOrCtrl+Z",
    },
    {
        action: KeyboardAction.editRedo,
        accelerator: "CmdOrCtrl+Shift+Z",
    },
    {
        action: KeyboardAction.editSelectAll,
        accelerator: "CmdOrCtrl+A",
    },
    {
        action: KeyboardAction.editFind,
        accelerator: "CmdOrCtrl+F",
    },
    {
        action: KeyboardAction.editFindClose,
        accelerator: "Esc",
    },
    // window commands
    {
        action: KeyboardAction.windowSplitHorizontally,
        accelerator: "CmdOrCtrl+-",
    },
    {
        action: KeyboardAction.windowSplitVertically,
        accelerator: "CmdOrCtrl+\\",
    },
    // view commands
    {
        action: KeyboardAction.viewReload,
        accelerator: "CmdOrCtrl+R",
    },
    {
        action: KeyboardAction.viewToggleFullScreen,
        accelerator: ToggleFullScreenAccelerator,
    },
    // black screen commands
    {
        action: KeyboardAction.blackScreenHide,
        accelerator: "CmdOrCtrl+H",
    },
    {
        action: KeyboardAction.blackScreenQuit,
        accelerator: "CmdOrCtrl+Q",
    },
    {
        action: KeyboardAction.blackScreenHideOthers,
        accelerator: "CmdOrCtrl+Alt+H",
    },
    // developer
    {
        action: KeyboardAction.developerToggleTools,
        accelerator: "CmdOrCtrl+Alt+I",
    },
    {
        action: KeyboardAction.developerToggleDebugMode,
        accelerator: "CmdOrCtrl+D",
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
