/* tslint:disable:no-unused-variable */
import * as React from "react";
import {fontAwesome} from "./css/FontAwesome";

export interface Props {
    isFocused: boolean;
    activate: () => void;
    position: number;
    closeHandler: React.EventHandler<React.MouseEvent<HTMLSpanElement>>;
}

export class TabHeaderComponent extends React.Component<Props, {}> {
    render() {
        return (
            <li className="tab-header"
                data-focused={this.props.isFocused}
                onClick={this.props.activate}>

                <span className="close-button"
                      onClick={this.props.closeHandler}>
                    {fontAwesome.times}
                </span>

                <span>⌘{this.props.position}</span>
            </li>
        );
    }
}
