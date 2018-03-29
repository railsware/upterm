import * as React from "react";


export interface Props {
    minimize: React.EventHandler<React.MouseEvent<HTMLSpanElement>>;
    maximize: React.EventHandler<React.MouseEvent<HTMLSpanElement>>;
    close: React.EventHandler<React.MouseEvent<HTMLSpanElement>>;
}

export class NavButtonsComponent extends React.Component<Props, {}> {
    render() {
        // button space not right (big square, small text)
        return (
            <div className="nav-buttons">
                <button id="min-btn" className="min-nav-button" onClick={this.props.minimize}>-</button>
                <button id="max-btn" className="max-nav-button" onClick={this.props.maximize}>+</button>
                <button id="close-btn" className="close-nav-button" onClick={this.props.close}>x</button>
            </div>
        );
    }
}
