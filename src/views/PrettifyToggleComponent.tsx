import * as React from "react";
import {fontAwesome} from "./css/FontAwesome";

interface Props {
    prettifyToggler: () => void;
    isPrettified: boolean;
}

export const PrettifyToggleComponent = (props: Props) =>
    <span className="prettify-toggle" data-enabled={props.isPrettified} onClick={props.prettifyToggler}>
        {fontAwesome.magic}
    </span>;
