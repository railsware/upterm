import * as React from "react";
import * as e from "electron";

export const Link: React.StatelessComponent<{absolutePath: string, children: any}> = ({
  absolutePath,
  children,
}) => <span
  style={{cursor: "pointer"}}
  className="underlineOnHover"
  onClick={() => e.shell.openExternal(`file://${absolutePath}`)}
>{children}</span>;
