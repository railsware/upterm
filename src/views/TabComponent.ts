import * as React from "react";

export interface TabProps {
    isActive: boolean;
    position: number;
    key: number;
}

const activenessClass: Map<boolean, string> = new Map([[false, "inactive"], [true, "active"]]);

export class TabComponent extends React.Component<TabProps, {}> {
    render() {
        return React.createElement(
            "li",
            { className: `tab ${activenessClass.get(this.props.isActive)}` },
            React.createElement("span", { className: "command-sign" }, "⌘"),
            React.createElement("span", { className: "position" }, this.props.position)
        );
    }
}
