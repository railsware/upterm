import * as React from "react";
import {SuggestionWithDefaults} from "../plugins/autocompletion_utils/Common";

interface SuggestionProps {
    suggestion: SuggestionWithDefaults;
    onHover: () => void;
    onClick: () => void;
    isHighlighted: boolean;
}

const SuggestionComponent = ({suggestion, onHover, onClick, isHighlighted}: SuggestionProps) =>
    <li className="suggestion"
        data-highlighted={isHighlighted}
        onMouseOver={onHover}
        onClick={onClick}>

        <i className="suggestion-icon" style={suggestion.style.css}>{suggestion.style.value}</i>
        <span>{suggestion.displayValue}</span>
        <span className="suggestion-synopsis">{suggestion.synopsis}</span>
    </li>;

interface AutocompleteProps {
    caretPosition: number;
    suggestions: SuggestionWithDefaults[];
    onSuggestionHover: (index: number) => void;
    onSuggestionClick: () => void;
    highlightedIndex: number;
    ref: string;
}

export class AutocompleteComponent extends React.Component<AutocompleteProps, {}> {
    render() {
        const suggestionViews = this.props.suggestions.slice().reverse().map((suggestion, index) =>
            <SuggestionComponent
                suggestion={suggestion}
                onHover={() => this.props.onSuggestionHover(index)}
                onClick={this.props.onSuggestionClick}
                key={index}
                isHighlighted={index === this.props.highlightedIndex}
            />,
        );

        return (
            <div className="autocomplete" style={{"--caret-position": this.props.caretPosition}}>
                <ul className="suggestions-list">{suggestionViews}</ul>
            </div>
        );
    }
}
