import * as React from "react";
import {stopBubblingUp} from "./ViewUtils";
import * as css from "./css/main";
import {fontAwesome} from "./css/FontAwesome";

interface Props {
    decorateToggler: () => void;
    isDecorated: boolean;
}

export class DecorationToggleComponent extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }

    render() {
        return (
            <span style={css.decorationToggle(this.props.isDecorated)}
               onClick={this.props.decorateToggler}
               dangerouslySetInnerHTML={{__html: fontAwesome.magic}}/>
        );
    }
}
