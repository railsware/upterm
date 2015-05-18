import React from 'react';
import _ from 'lodash';

export default React.createClass({
    render() {
        var position = _.pick(this.props.caretPosition, 'left');

        var suggestionViews = this.props.suggestions.map((suggestion, index) => {
            var props = {
                className: (index == this.props.selectedIndex ? 'selected' : ''),
                key: index
            };

            return (<li {...props}>{suggestion}</li>);
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
