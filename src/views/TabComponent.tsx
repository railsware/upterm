import {SessionComponent} from "./SessionComponent";
import * as React from "react";
import * as css from "./css/styles";
import {Session} from "../shell/Session";

type Props = {
    sessions: Session[];
    focusedSessionIndex: number;
    isFocused: boolean;
    onSessionFocus: (index: number) => void
};

export class TabComponent extends React.Component<Props, {}> {
    sessionComponents: SessionComponent[];
    focusedSessionComponent: SessionComponent | undefined;

    render() {
        this.sessionComponents = [];
        const sessionComponents = this.props.sessions.map((session, index) => {
            const isFocused = this.props.isFocused && index === this.props.focusedSessionIndex;

            return (
                <SessionComponent
                    session={session}
                    key={session.id}
                    ref={sessionComponent => {
                        // Unmount.
                        if (!sessionComponent) {
                            return;
                        }

                        if (isFocused) {
                            this.focusedSessionComponent = sessionComponent!;
                        }
                        this.sessionComponents[index] = sessionComponent!;
                    }}
                    isFocused={isFocused}
                    focus={() => {
                        this.props.onSessionFocus(index);
                        this.forceUpdate();
                    }}>
                </SessionComponent>
            );
        });

        return (
            <div className="tab" data-focused={this.props.isFocused}>
                <div className="sessions" style={css.sessions(this.props.sessions)}>
                    {sessionComponents}
                </div>
            </div>
        );
    }
}
