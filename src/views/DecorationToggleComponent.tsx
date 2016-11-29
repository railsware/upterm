import * as React from "react";
import * as css from "./css/main";
import {fontAwesome} from "./css/FontAwesome";

interface Props {
    decorateToggler: () => void;
    isDecorated: boolean;
}

const DecorationToggleComponent = (props: Props) => <span
    style={css.decorationToggle(props.isDecorated)}
    onClick={props.decorateToggler}
>{fontAwesome.magic}</span>;

export default DecorationToggleComponent;
