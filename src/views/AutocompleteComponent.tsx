import * as React from "react";
import {SuggestionWithDefaults} from "../plugins/autocompletion_utils/Common";
import * as css from "./css/main";

interface SuggestionProps {
    suggestion: SuggestionWithDefaults;
    onHover: () => void;
    onClick: () => void;
    isHighlighted: boolean;
}

const SuggestionComponent = ({suggestion, onHover, onClick, isHighlighted}: SuggestionProps) =>
    <li style={css.autocomplete.item(isHighlighted)}
        onMouseOver={onHover}
        onClick={onClick}>

        <i style={{...css.suggestionIcon, ...suggestion.style.css} as any}>{suggestion.style.value}</i>
        <span style={css.autocomplete.value}>{suggestion.displayValue}</span>
        <span style={css.autocomplete.synopsis}>{suggestion.synopsis}</span>
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
            <div className="autocomplete" style={css.autocomplete.box(this.props.caretPosition)}>
                <ul style={css.autocomplete.suggestionsList}>{suggestionViews}</ul>
            </div>
        );
    }
}
