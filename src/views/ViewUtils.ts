import {KeyCode} from "../Enums";
import * as _ from "lodash";
import {writeFileCreatingParents, windowBoundsFilePath} from "../utils/Common";

export function stopBubblingUp(event: Event): Event {
    event.stopPropagation();
    event.preventDefault();

    return event;
}

export const keys = {
    goUp: (event: KeyboardEvent) => (event.ctrlKey && event.keyCode === KeyCode.P) || event.keyCode === KeyCode.Up,
    goDown: (event: KeyboardEvent) => (event.ctrlKey && event.keyCode === KeyCode.N) || event.keyCode === KeyCode.Down,
    enter: (event: KeyboardEvent) => event.keyCode === KeyCode.CarriageReturn,
    tab: (event: KeyboardEvent) => event.keyCode === KeyCode.Tab,
    deleteWord: (event: KeyboardEvent) => event.ctrlKey && event.keyCode === KeyCode.W,
    interrupt: (event: KeyboardEvent) => event.ctrlKey && event.keyCode === KeyCode.C,
};


export function isModifierKey(event: KeyboardEvent) {
    return [KeyCode.Shift, KeyCode.Ctrl, KeyCode.Alt].includes(event.keyCode);
}

export function withModifierKey(event: KeyboardEvent) {
    return isModifierKey(event) || event.ctrlKey || event.altKey || event.metaKey;
}

export function isSpecialKey(event: KeyboardEvent): boolean {
  return _.values(keys).some((matcher: (event: KeyboardEvent) => boolean) => matcher(event));
}

export function setCaretPosition(node: Node, position: number) {
    const selection = window.getSelection();
    const range = document.createRange();

    if (node.childNodes.length) {
        range.setStart(node.childNodes[0], position);
    } else {
        range.setStart(node, 0);
    }
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
}

/**
 * @link http://stackoverflow.com/questions/4811822/get-a-ranges-start-and-end-offsets-relative-to-its-parent-container/4812022#4812022
 */
export function getCaretPosition(element: Node): number {
    const selection = element.ownerDocument.defaultView.getSelection();

    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);

        return preCaretRange.toString().length;
    } else {
        return 0;
    }
}

export function saveWindowBounds(browserWindow: Electron.BrowserWindow) {
    writeFileCreatingParents(windowBoundsFilePath, JSON.stringify(browserWindow.getBounds())).then(
        () => void 0,
        (error: any) => { if (error) throw error; }
    );
}
