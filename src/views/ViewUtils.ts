import {Attributes} from "../Interfaces";
import * as React from "react";
import {CharCode} from "../Enums";

export function stopBubblingUp(event: Event): Event {
    event.stopPropagation();
    event.preventDefault();

    return event;
}

export function scrollToBottom(): void {
    let session = $(".session.active");
    session.scrollTop(session[0].scrollHeight);
}

export const keys = {
    goUp: (event: KeyboardEvent) => (event.ctrlKey && event.keyCode === CharCode.P) || event.keyCode === CharCode.Up,
    goDown: (event: KeyboardEvent) => (event.ctrlKey && event.keyCode === CharCode.N) || event.keyCode === CharCode.Down,
    enter: (event: KeyboardEvent) => event.keyCode === CharCode.CarriageReturn,
    tab: (event: KeyboardEvent) => event.keyCode === CharCode.Tab,
    deleteWord: (event: KeyboardEvent) => event.ctrlKey && event.keyCode === CharCode.W,
    interrupt: (event: KeyboardEvent) => event.ctrlKey && event.keyCode === CharCode.C,
};


export function isModifierKey(event: KeyboardEvent) {
    return [CharCode.Shift, CharCode.Ctrl, CharCode.Alt].includes(event.keyCode);
}

export function withModifierKey(event: KeyboardEvent) {
    return isModifierKey(event) || event.ctrlKey || event.altKey || event.metaKey;
}

export const isSpecialKey = _.memoize(
    (event: React.KeyboardEvent) => _.values(keys).some((matcher: (event: React.KeyboardEvent) => boolean) => matcher(event)),
    (event: React.KeyboardEvent) => JSON.stringify([event.ctrlKey, event.keyCode])
);

export function getHTMLAttributes(object: Dictionary<any>): Object {
    let htmlAttributes: Dictionary<any> = {};

    Object.keys(object).forEach((key: string) => htmlAttributes[`data-${key}`] = object[key]);

    return htmlAttributes;
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
 * @note I have no idea how it works. Copied from StackOverflow.
 * @link http://stackoverflow.com/questions/4811822/get-a-ranges-start-and-end-offsets-relative-to-its-parent-container/4812022#4812022
 */
export function getCaretPosition(element: any): number {
    let caretOffset = 0;
    let document = element.ownerDocument || element.document;
    let win = document.defaultView || document.parentWindow;
    let selection: any;

    if (typeof win.getSelection !== "undefined") {
        selection = win.getSelection();
        if (selection.rangeCount > 0) {
            let range = win.getSelection().getRangeAt(0);
            let preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(element);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            caretOffset = preCaretRange.toString().length;
        }
    } else {
        selection = document.selection;
        if (selection && selection.type !== "Control") {
            let textRange = selection.createRange();
            let preCaretTextRange = document.body.createTextRange();
            preCaretTextRange.moveToElementText(element);
            preCaretTextRange.setEndPoint("EndToEnd", textRange);
            caretOffset = preCaretTextRange.text.length;
        }
    }
    return caretOffset;
}
