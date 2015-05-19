import React from 'react/addons';
import _ from 'lodash';

export default React.createClass({
    render() {
        var position = _.pick(this.props.caretPosition, 'left');

        var suggestionViews = this.props.suggestions.map((suggestion, index) => {
            return (
                <li {...this.getRenderingProps(suggestion, index)}>
                    <i className="icon"></i>
                    <span className="value">{suggestion.value}</span>
                    <span className="synopsis">{suggestion.synopsis}</span>
                </li>
            );
        });

        if (this.props.caretPosition.top + 300 > window.innerHeight) {
            position['bottom'] = 28;
            suggestionViews = _(suggestionViews).reverse().value();
        }

        return (
            <div className="autocomplete" style={position}>
                <ul>
                    {suggestionViews}
                </ul>
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
