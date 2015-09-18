'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

var _distScriptsViewsApplicationViewJs = require('./dist/scripts/views/ApplicationView.js');

var _distScriptsViewsApplicationViewJs2 = _interopRequireDefault(_distScriptsViewsApplicationViewJs);

var keys = {
    goUp: function goUp(event) {
        return event.ctrlKey && event.keyCode === 80 || event.keyCode === 38;
    },
    goDown: function goDown(event) {
        return event.ctrlKey && event.keyCode === 78 || event.keyCode === 40;
    },
    enter: function enter(event) {
        return event.keyCode === 13;
    },
    tab: function tab(event) {
        return event.keyCode === 9;
    },
    deleteWord: function deleteWord(event) {
        return event.ctrlKey && event.keyCode === 87;
    }
};

function scrollToBottom() {
    $('html body').animate({ scrollTop: $(document).height() }, 0);
}

function focusLastInput(event) {
    if (_lodash2['default'].contains(event.target.classList, 'prompt') || event.metaKey) {
        return;
    }

    var originalEvent = event.originalEvent;

    if (isMetaKey(originalEvent)) {
        return;
    }

    var newEvent = new KeyboardEvent("keydown", _lodash2['default'].pick(originalEvent, ['altkey', 'bubbles', 'cancelBubble', 'cancelable', 'charCode', 'ctrlKey', 'keyIdentifier', 'metaKey', 'shiftKey']));
    var target = _lodash2['default'].last(document.getElementsByClassName('prompt'));
    target.focus();
    withCaret(target, function () {
        return target.innerText.length;
    });
    target.dispatchEvent(newEvent);
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
    return _lodash2['default'].contains([16, 17, 18], event.keyCode) || event.ctrlKey || event.altKey || event.metaKey;
}

function isMetaKey(event) {
    return event.metaKey || _lodash2['default'].some([event.key, event.keyIdentifier], function (key) {
        return _lodash2['default'].includes(['Shift', 'Alt', 'Ctrl'], key);
    });
}

var isDefinedKey = _lodash2['default'].memoize(function (event) {
    return _lodash2['default'].some(_lodash2['default'].values(keys), function (matcher) {
        return matcher(event);
    });
}, function (event) {
    return [event.ctrlKey, event.keyCode];
});

function stopBubblingUp(event) {
    event.stopPropagation();
    event.preventDefault();

    return event;
}

// TODO: Figure out how it works.
function createEventHandler() {
    var subject = function subject() {
        subject.onNext.apply(subject, arguments);
    };

    getEnumerablePropertyNames(_rx2['default'].Subject.prototype).forEach(function (property) {
        subject[property] = _rx2['default'].Subject.prototype[property];
    });
    _rx2['default'].Subject.call(subject);

    return subject;
}

function getEnumerablePropertyNames(target) {
    var result = [];
    for (var key in target) {
        result.push(key);
    }
    return result;
}

$(document).ready(function () {
    _react2['default'].render(_react2['default'].createElement(_distScriptsViewsApplicationViewJs2['default'], null), document.getElementById('black-board'));
    // TODO: focus the last input of the active terminal.
    $(document).keydown(function (event) {
        return focusLastInput(event);
    });
});