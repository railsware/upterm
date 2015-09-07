import React from 'react/addons';
import _ from 'lodash';

export default React.createClass({
    render() {
        var offset = _.pick(this.props.caretOffset, 'left');

        var suggestionViews = this.props.suggestions.map((suggestion, index) => {
            var scoreStyle = window.DEBUG == 1 ? {} : {display: 'none'};

            return (
                <li {...this.getRenderingProps(suggestion, index)}>
                    <i className="icon"></i>
                    <span className="value">{suggestion.value}</span>
                    <span style={scoreStyle} className="score">{suggestion.score.toFixed(2)}</span>
                    <span className="synopsis">{suggestion.synopsis}</span>
                </li>
            );
        });

        var selectedSuggestionDescription = this.props.suggestions[this.props.selectedIndex].description;

        if (selectedSuggestionDescription) {
            var descriptionChild =
                <div className="description">
                    {selectedSuggestionDescription}
                </div>;
        }

        if (this.props.caretOffset.top + 300 > window.innerHeight) {
            offset['bottom'] = 28 + (selectedSuggestionDescription ? 28 : 0);
        }

        return (
            <div className="autocomplete" style={offset}>
                <ul>
                    {suggestionViews}
                </ul>
                {descriptionChild}
            </div>
        )
    },

    getRenderingProps(suggestion, index) {
        var props = {
            className: [suggestion.type],
            key: index
        };

        if (index == this.props.selectedIndex) {
            props = React.addons.update(props, {
                    className: {$push: ['selected']},
                    ref: {$set: 'selected'}
                }
            );
        }

        props.className = props.className.join(' ');

        return props;
    },

    componentDidUpdate() {
        this.refs.selected.getDOMNode().scrollIntoView(false);
    }
});
