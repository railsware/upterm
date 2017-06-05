import * as React from "react";
import * as e from "electron";
import {CSSObject} from "../views/css/definitions";

export const Link: React.StatelessComponent<{ absolutePath: string, children: any, style?: CSSObject }> = ({
  absolutePath,
  children,
  style,
}) => <span
  style={{cursor: "pointer", ...style}}
  className="underlineOnHover"
  onClick={() => e.shell.openExternal(`file://${absolutePath}`)}
>{children}</span>;
