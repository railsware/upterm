const ReactDOM = require('react-dom');
import * as React from 'react';
import * as _ from 'lodash';
import ApplicationView from './ApplicationView';
import {isMetaKey} from './Prompt';

function focusLastInput(event) {
    if (_.contains(event.target.classList, 'prompt') || event.metaKey) {
        return;
    }

    var originalEvent = event.originalEvent;

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

function withCaret(target, callback) {
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
    ReactDOM.render(React.createElement(ApplicationView), document.getElementById('black-board'));
    // TODO: focus the last input of the active terminal.
    $(document).keydown(event => focusLastInput(event));
});
