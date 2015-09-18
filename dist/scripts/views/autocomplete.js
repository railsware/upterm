'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _reactAddons = require('react/addons');

var _reactAddons2 = _interopRequireDefault(_reactAddons);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

exports['default'] = _reactAddons2['default'].createClass({
    displayName: 'autocomplete',

    render: function render() {
        var _this = this;

        var offset = _lodash2['default'].pick(this.props.caretOffset, 'left');

        var suggestionViews = this.props.suggestions.map(function (suggestion, index) {
            var scoreStyle = window.DEBUG === 1 ? {} : { display: 'none' };

            return _reactAddons2['default'].createElement(
                'li',
                _this.getRenderingProps(suggestion, index),
                _reactAddons2['default'].createElement('i', { className: 'icon' }),
                _reactAddons2['default'].createElement(
                    'span',
                    { className: 'value' },
                    suggestion.value
                ),
                _reactAddons2['default'].createElement(
                    'span',
                    { style: scoreStyle, className: 'score' },
                    suggestion.score.toFixed(2)
                ),
                _reactAddons2['default'].createElement(
                    'span',
                    { className: 'synopsis' },
                    suggestion.synopsis
                )
            );
        });

        var selectedSuggestionDescription = this.props.suggestions[this.props.selectedIndex].description;

        if (selectedSuggestionDescription) {
            var descriptionChild = _reactAddons2['default'].createElement(
                'div',
                { className: 'description' },
                selectedSuggestionDescription
            );
        }

        if (this.props.caretOffset.top + 300 > window.innerHeight) {
            offset['bottom'] = 28 + (selectedSuggestionDescription ? 28 : 0);
        }

        return _reactAddons2['default'].createElement(
            'div',
            { className: 'autocomplete', style: offset },
            _reactAddons2['default'].createElement(
                'ul',
                null,
                suggestionViews
            ),
            descriptionChild
        );
    },

    getRenderingProps: function getRenderingProps(suggestion, index) {
        var props = {
            className: [suggestion.type],
            key: index
        };

        if (index === this.props.selectedIndex) {
            props = _reactAddons2['default'].addons.update(props, {
                className: { $push: ['selected'] },
                ref: { $set: 'selected' }
            });
        }

        props.className = props.className.join(' ');

        return props;
    },

    componentDidUpdate: function componentDidUpdate() {
        this.refs.selected.getDOMNode().scrollIntoView(false);
    }
});
module.exports = exports['default'];