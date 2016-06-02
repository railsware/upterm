import * as React from "react";
import {stopBubblingUp} from "./ViewUtils";
import * as css from "./css/main";
import {fontAwesome} from "./css/FontAwesome";
import {decorateByDefault} from "./3_JobComponent";

interface Props {
    decorateToggler: () => boolean;
}

interface State {
    enabled: boolean;
}

export default class DecorationToggleComponent extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = { enabled: decorateByDefault };
    }

    handleClick(event: KeyboardEvent) {
        stopBubblingUp(event);
        this.setState({ enabled: this.props.decorateToggler() });
    }

    render() {
        return (
            <span style={css.decorationToggle(this.state.enabled)}
               onClick={this.handleClick.bind(this)}
               dangerouslySetInnerHTML={{__html: fontAwesome.magic}}/>
        );
    }
}
