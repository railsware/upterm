import * as React from "react";
import {Suggestion} from "../plugins/autocompletion_providers/Suggestions";
import {css} from "./css/main";

interface SuggestionProps {
    suggestion: Suggestion;
    onHover: () => void;
    onClick: () => void;
    isHighlighted: boolean;
}

const SuggestionComponent = ({suggestion, onHover, onClick, isHighlighted}: SuggestionProps) => {
    let classes: string[] = [];

    if (isHighlighted) {
        classes.push("highlighted");
    }

    return (
        <li className={classes.join(" ")}
            style={{cursor: "pointer"}}
            onMouseOver={onHover}
            onClick={onClick}>

            <i style={Object.assign({}, css.icon, suggestion.style.css)} dataColor={suggestion.iconColor} dangerouslySetInnerHTML={{__html: suggestion.style.value}}/>
            <span className="value">{suggestion.displayValue}</span>
            <span className="synopsis">{suggestion.synopsis}</span>
            <span style={css.debugTag}>{suggestion.debugTag}</span>
        </li>
    );
};

interface AutocompleteProps {
    caretOffset: Offset;
    suggestions: Suggestion[];
    onSuggestionHover: (index: number) => void;
    onSuggestionClick: () => void;
    highlightedIndex: number;
    ref: string;
}

export default class AutocompleteComponent extends React.Component<AutocompleteProps, {}> {
    render() {
        const suggestionViews = this.props.suggestions.map((suggestion, index) =>
            <SuggestionComponent suggestion={suggestion}
                                 onHover={() => this.props.onSuggestionHover(index)}
                                 onClick={this.props.onSuggestionClick}
                                 key={index}
                                 isHighlighted={index === this.props.highlightedIndex}/>
        );

        const suggestionDescription = this.props.suggestions[this.props.highlightedIndex].description;
        let descriptionElement: React.ReactElement<any>;
        if (suggestionDescription) {
            descriptionElement = <div style={css.description}>{suggestionDescription}</div>;
        }

        if (this.props.caretOffset.top + 300 > window.innerHeight) {
            this.props.caretOffset.bottom = 28 + (suggestionDescription ? 28 : 0);
        }

        return (
            <div className="autocomplete" style={{left: this.props.caretOffset.left}}>
                <ul>{suggestionViews}</ul>
                {descriptionElement}
            </div>
        );
    }
}
