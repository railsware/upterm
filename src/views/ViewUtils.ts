import {KeyCode} from "../Enums";
import {windowBoundsFilePath} from "../utils/Common";
import {outputJSON} from "fs-extra";

export function stopBubblingUp(event: Event): Event {
    event.stopPropagation();
    event.preventDefault();

    return event;
}

export function isModifierKey(event: KeyboardEvent) {
    return [KeyCode.Shift, KeyCode.Ctrl, KeyCode.Meta, KeyCode.Alt, KeyCode.CapsLock, KeyCode.AltGraph].includes(event.keyCode);
}

export function setCaretPosition(node: Node, position: number) {
    console.log(position);
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
    return outputJSON(windowBoundsFilePath, browserWindow.getBounds());
}
