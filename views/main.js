import ReactDOM from 'react-dom';
import _ from 'lodash';
import ApplicationView from './compiled/src/views/ApplicationView.js';
import {isMetaKey} from './compiled/src/views/Prompt.js';

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
    var target = _.last(document.getElementsByClassName('prompt'));
    target.focus();
    withCaret(target, () => target.innerText.length);
    target.dispatchEvent(newEvent)
}

function withCaret(target, callback) {
    var selection = window.getSelection();
    var range = document.createRange();

    var offset = callback(selection.baseOffset);

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
    ReactDOM.render(<ApplicationView/>, document.getElementById('black-board'));
    // TODO: focus the last input of the active terminal.
    $(document).keydown(event => focusLastInput(event));
});
