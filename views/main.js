import React from 'react';
import _ from 'lodash';
import Rx from 'rx';
import {TerminalLayout} from '/Users/me/dev/black-screen/compiled/src/views/TerminalLayout';

var keys = {
    goUp: event => (event.ctrlKey && event.keyCode === 80) || event.keyCode === 38,
    goDown: event => (event.ctrlKey && event.keyCode === 78) || event.keyCode === 40,
    enter: event => event.keyCode === 13,
    tab: event => event.keyCode === 9,
    deleteWord: event => event.ctrlKey && event.keyCode == 87
};

function scrollToBottom() {
    $('html body').animate({ scrollTop: $(document).height() }, 0);
}

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

function setCaretPosition(node, position) {
    var selection = window.getSelection();
    var range = document.createRange();

    if (node.childNodes.length) {
        range.setStart(node.childNodes[0], position);
    } else {
        range.setStart(node, 0);
    }
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
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

function isCommandKey(event) {
    return _.contains([16, 17, 18], event.keyCode) || event.ctrlKey || event.altKey || event.metaKey;
}

function isMetaKey(event) {
    return event.metaKey || _.some([event.key, event.keyIdentifier],
                                   key => _.includes(['Shift', 'Alt', 'Ctrl'], key));
}

const isDefinedKey = _.memoize(event => _.some(_.values(keys), matcher => matcher(event)),
                               event => [event.ctrlKey, event.keyCode]);

function stopBubblingUp(event) {
    event.stopPropagation();
    event.preventDefault();

    return event;
}

// TODO: Figure out how it works.
function createEventHandler() {
    var subject = function() {
        subject.onNext.apply(subject, arguments);
    };

    getEnumerablePropertyNames(Rx.Subject.prototype)
        .forEach(function (property) {
            subject[property] = Rx.Subject.prototype[property];
        });
    Rx.Subject.call(subject);

    return subject;
}

function getEnumerablePropertyNames(target) {
    var result = [];
    for (var key in target) {
        result.push(key);
    }
    return result;
}

$(document).ready(() => {
    React.render(<TerminalLayout/>, document.getElementById('black-board'));
    // TODO: focus the last input of the active terminal.
    $(document).keydown(event => focusLastInput(event));
});
