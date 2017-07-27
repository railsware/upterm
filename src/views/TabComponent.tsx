import {Tab} from "./TabHeaderComponent";
import {PaneComponent} from "./PaneComponent";
import * as React from "react";
import * as css from "./css/styles";

type Props = {
    tab: Tab;
};

export class TabComponent extends React.Component<Props, {}> {
    render() {

        const paneComponents = this.props.tab.panes.children.map(pane => {
            const session = pane.session;
            const isFocused = pane === this.props.tab.focusedPane;

            return (
                <PaneComponent
                    session={session}
                    key={session.id}
                    ref={sessionComponent => { pane.setSessionComponent(sessionComponent!); }}
                    isFocused={isFocused}
                    updateFooter={isFocused ? () => this.forceUpdate() : undefined}
                    focus={() => {
                        this.props.tab.focusPane(pane);
                        this.forceUpdate();
                    }}>
                </PaneComponent>
            );
        });

        return (
            <div className="tab">
                <div className="panes" style={css.sessions(this.props.tab.panes)}>
                    {paneComponents}
                </div>
            </div>
        );
    }
}
