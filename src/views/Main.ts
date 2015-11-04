import SyntheticEvent = __React.SyntheticEvent;
import KeyboardEvent = __React.KeyboardEvent;
const ReactDOM = require('react-dom');
import * as React from 'react';
import * as _ from 'lodash';
import ApplicationComponent from './ApplicationComponent';
import {isMetaKey} from './PromptComponent';

function focusLastInput(event: JQueryKeyEventObject) {
    if (_.contains(event.target.classList, 'prompt') || event.metaKey) {
        return;
    }

    var originalEvent = <any>event.originalEvent;

    if (isMetaKey(originalEvent)) {
        return;
    }

    var newEvent = new KeyboardEvent("keydown", _.pick(originalEvent, [
            'altkey', 'bubbles', 'cancelBubble', 'cancelable', 'charCode',
            'ctrlKey', 'keyIdentifier', 'metaKey', 'shiftKey'
        ]));
    var target = $('.prompt').last().get(0);
    target.focus();
    withCaret(target, () => target.innerText.length);
    target.dispatchEvent(newEvent)
}

function withCaret(target: Node, callback: (n: number) => number) {
    var selection = window.getSelection();
    var range = document.createRange();

    var offset = callback(selection.anchorOffset);

    if (target.childNodes.length) {
        range.setStart(target.childNodes[0], offset);
    } else {
        range.setStart(target, 0);
    }
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
}

$(document).ready(() => {
    ReactDOM.render(React.createElement(ApplicationComponent), document.getElementById('black-screen'));
    // TODO: focus the last input of the active terminal.
    $(document).keydown(event => focusLastInput(event));
});
