import React from 'react';
import _ from 'lodash';

export default React.createClass({
    render() {
        var position = _.pick(this.props.caretPosition, 'left');

        var suggestionViews = this.props.suggestions.map((suggestion, index) => {
            var className = index == this.props.selectedIndex ? 'selected' : '';
            return (<li className={className}>{suggestion}</li>);
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
    }
});
