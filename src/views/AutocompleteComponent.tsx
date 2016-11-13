import * as React from "react";
import {Suggestion} from "../plugins/autocompletion_utils/Common";
import * as css from "./css/main";
import {HighlightSequencedSuggestion} from "../SequenceKit";

interface SuggestionProps {
    suggestion: Suggestion;
    onHover: () => void;
    onClick: () => void;
    isHighlighted: boolean;
    searchKey: string;
}

const SuggestionComponent = ({suggestion, onHover, onClick, isHighlighted, searchKey}: SuggestionProps) =>
    <li style={css.autocomplete.item(isHighlighted)}
        onMouseOver={onHover}
        onClick={onClick}>

        <i style={Object.assign({}, css.suggestionIcon, suggestion.style.css)} dangerouslySetInnerHTML={{__html: suggestion.style.value}}/>

        <span style={css.autocomplete.value}
              dangerouslySetInnerHTML={{__html: HighlightSequencedSuggestion( suggestion.displayValue, searchKey)}} />
        <span style={css.autocomplete.synopsis}>{suggestion.synopsis}</span>
    </li>;

interface AutocompleteProps {
    offsetTop: number;
    caretPosition: number;
    suggestions: Suggestion[];
    onSuggestionHover: (index: number) => void;
    onSuggestionClick: () => void;
    highlightedIndex: number;
    ref: string;
    searchKey: string;
}

export class AutocompleteComponent extends React.Component<AutocompleteProps, {}> {
    render() {
        const suggestionViews = this.props.suggestions.map((suggestion, index) =>
            <SuggestionComponent suggestion={suggestion}
                                 onHover={() => this.props.onSuggestionHover(index)}
                                 onClick={this.props.onSuggestionClick}
                                 key={index}
                                 searchKey={this.props.searchKey}
                                 isHighlighted={index === this.props.highlightedIndex}/>
        );

        const suggestionDescription = this.props.suggestions[this.props.highlightedIndex].description;
        let descriptionElement: React.ReactElement<any> | undefined;

        if (suggestionDescription) {
            descriptionElement = <div style={css.autocompletionDescription}>{suggestionDescription}</div>;
        }

        return (
            <div style={css.autocomplete.box(this.props.offsetTop, this.props.caretPosition, suggestionDescription.length !== 0)}>
                <ul style={css.autocomplete.suggestionsList}>{suggestionViews}</ul>
                {descriptionElement}
            </div>
        );
    }
}
