import * as React from "react";
import * as _ from "lodash";
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
        const suggestionViews = this.props.suggestions.map((suggestion, index) => {
            return React.createElement(SuggestionComponent, {
                suggestion: suggestion,
                onHover: this.props.onSuggestionHover.bind(this, index),
                onClick: this.props.onSuggestionClick,
                key: index,
                isHighlighted: index === this.props.highlightedIndex,
            });
        });

        const suggestionDescription = this.props.suggestions[this.props.highlightedIndex].description;
        let descriptionElement: React.ReactElement<any>;
        if (suggestionDescription) {
            descriptionElement = React.createElement("div", { className: "description" }, suggestionDescription);
        }

        let offset = <Offset>_.pick(this.props.caretOffset, "left");
        if (this.props.caretOffset.top + 300 > window.innerHeight) {
            offset.bottom = 28 + (suggestionDescription ? 28 : 0);
        }

        return React.createElement(
            "div",
            { className: "autocomplete", style: offset },
            React.createElement("ul", undefined, suggestionViews),
            descriptionElement
        );
    }
}

interface SuggestionProps {
    suggestion: Suggestion;
    key: number;
    onHover: (index: number) => void;
    onClick: () => void;
    isHighlighted: boolean;
}

class SuggestionComponent extends React.Component<SuggestionProps, {}> {
    render() {
        let classes = [this.props.suggestion.type];

        if (this.props.isHighlighted) {
            classes.push("highlighted");
        }

        return React.createElement(
            "li",
            {
                className: classes.join(" "),
                style: { cursor: "pointer" },
                onMouseOver: this.props.onHover,
                onClick: this.props.onClick,
            },
            React.createElement("i", { className: "icon", "data-color": this.props.suggestion.color }),
            React.createElement("span", { className: "value" }, this.props.suggestion.displayValue),
            React.createElement("span", { className: "synopsis" }, this.props.suggestion.synopsis)
        );
    }
}
