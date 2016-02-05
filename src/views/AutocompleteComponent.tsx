import * as React from "react";
import {Suggestion} from "../plugins/autocompletion_providers/Suggestions";

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
            descriptionElement = <div className="description">{suggestionDescription}</div>;
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

interface SuggestionProps {
    suggestion: Suggestion;
    onHover: () => void;
    onClick: () => void;
    isHighlighted: boolean;
}

class SuggestionComponent extends React.Component<SuggestionProps, {}> {
    render() {
        let classes = [this.props.suggestion.type];

        if (this.props.isHighlighted) {
            classes.push("highlighted");
        }

        return (
            <li className={classes.join(" ")}
                style={{cursor: "pointer"}}
                onMouseOver={this.props.onHover}
                onClick={this.props.onClick}>

                <i className="icon" dataColor={this.props.suggestion.iconColor}/>
                <span className="value">{this.props.suggestion.displayValue}</span>
                <span className="synopsis">{this.props.suggestion.synopsis}</span>
            </li>
        );
    }
}
