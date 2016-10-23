import * as React from "react";
import * as e from "electron";
import {CSSObject} from "../views/css/definitions";

const Link: React.StatelessComponent<{ absolutePath: string, children?: React.ReactElement<any>, style?: CSSObject }> = ({
  absolutePath,
  children,
  style,
}) => <span
  style={Object.assign({}, { cursor: "pointer" }, style)}
  className="underlineOnHover"
  onClick={() => e.shell.openExternal(`file://${absolutePath}`)}
>{children}</span>;

export default Link;
