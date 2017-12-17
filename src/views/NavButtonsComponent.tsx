import * as React from "react";


export interface Props {
    minimize: React.EventHandler<React.MouseEvent<HTMLSpanElement>>;
    maximize: React.EventHandler<React.MouseEvent<HTMLSpanElement>>;
    close: React.EventHandler<React.MouseEvent<HTMLSpanElement>>;
}

export class NavButtonsComponent extends React.Component<Props, {}> {
    constructor() {
        super();
    }
    render() {
        // button space not right (big square, small text)
        return (
            <div className="navButtons">
                <button id="min-btn" onClick={this.props.minimize}>-</button>
                <button id="max-btn" onClick={this.props.maximize}>+</button>
                <button id="close-btn" onClick={this.props.close}>x</button>
            </div>
        );
    }
}
