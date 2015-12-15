import * as React from 'react';
import * as _ from 'lodash';

type Offset = {top: number, left: number, bottom: number};

interface AutocompleteProps {
    caretOffset: Offset;
    suggestions: Suggestion[];
    onHoverSuggestion: Function;
    onClickSuggestion: Function;
    highlightedIndex: number;
}

export default class AutocompleteComponent extends React.Component<AutocompleteProps, {}> { 
    render() {
        const suggestionViews = this.props.suggestions.map((suggestion, index) => {
            return React.createElement(SuggestionCompoonent, {
                suggestion: suggestion,
                onHoverSuggestion: this.props.onHoverSuggestion.bind(this, index),
                onClickSuggestion: this.props.onClickSuggestion,
                key: index,
                isHighlighted: index === this.props.highlightedIndex
            });
        });

        const suggestionDescription = this.props.suggestions[this.props.highlightedIndex].description;
        if (suggestionDescription) {
            var descriptionElement = React.createElement('div', { className: 'description' }, suggestionDescription);
        }

        let offset = <Offset>_.pick(this.props.caretOffset, 'left');
        if (this.props.caretOffset.top + 300 > window.innerHeight) {
            offset.bottom = 28 + (suggestionDescription ? 28 : 0);
        }

        return React.createElement('div', { className: 'autocomplete', style: offset },
            React.createElement('ul', null, suggestionViews),
            descriptionElement
        );
    }
}

interface SuggestionProps {
    suggestion: Suggestion;
    key: number;
    onHoverSuggestion: Function;
    onClickSuggestion: Function
    isHighlighted: boolean;
}

class SuggestionCompoonent extends React.Component<SuggestionProps, {}> {
    render() {
        const scoreStyle = window.DEBUG ? {} : { display: 'none' };
        const suggestionStyle = { cursor: "pointer" }
        
        let classes = [this.props.suggestion.type];

        if (this.props.isHighlighted) {
            classes.push('highlighted');
        }

        return React.createElement('li', { className: classes.join(' '), style: suggestionStyle, onMouseOver: this.props.onHoverSuggestion, onClick: this.props.onClickSuggestion},
            React.createElement('i', { className: 'icon' }),
            React.createElement('span', { className: 'value' }, this.props.suggestion.value),
            React.createElement('span', {
                style: scoreStyle,
                className: 'score'
            }, this.props.suggestion.score.toFixed(2)),
            React.createElement('span', { className: 'synopsis' }, this.props.suggestion.synopsis)
        );
    }
}
