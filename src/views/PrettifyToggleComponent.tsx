import * as React from "react";
import * as css from "./css/main";
import {fontAwesome} from "./css/FontAwesome";

interface Props {
    prettifyToggler: () => void;
    isPrettified: boolean;
}

export const PrettifyToggleComponent = (props: Props) => <span
    style={css.prettifyToggle(props.isPrettified)}
    onClick={props.prettifyToggler}
>{fontAwesome.magic}</span>;
