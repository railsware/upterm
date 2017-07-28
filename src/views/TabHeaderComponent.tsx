/* tslint:disable:no-unused-variable */
import * as React from "react";
import {Session} from "../shell/Session";
import {ApplicationComponent} from "./ApplicationComponent";
import {fontAwesome} from "./css/FontAwesome";
import {Pane, PaneList} from "../utils/PaneTree";

export interface Props {
    isFocused: boolean;
    activate: () => void;
    position: number;
    closeHandler: React.EventHandler<React.MouseEvent<HTMLSpanElement>>;
}

export class TabHeaderComponent extends React.Component<Props, {}> {
    constructor() {
        super();
    }

    render() {
        return (
            <li className="tab-header"
                data-focused={this.props.isFocused}
                onClick={this.props.activate}>

                <span className="close-button"
                      onClick={this.props.closeHandler}>
                    {fontAwesome.times}
                </span>

                <span>⌘{this.props.position}</span>
            </li>
        );
    }
}

export class Tab {
    readonly panes: PaneList;
    private _focusedPane: Pane;

    constructor(private application: ApplicationComponent) {
        const pane = new Pane(new Session(this.application));

        this.panes = new PaneList([pane]);
        this._focusedPane = pane;
    }

    otherPane(): void {
        const session = new Session(this.application);

        this.panes.add(session);
        this.focusPane(this.panes.next(this.focusedPane));
    }

    closeFocusedPane(): void {
        this.focusedPane.session.jobs.forEach(job => {
            job.removeAllListeners();
            job.interrupt();
        });
        this.focusedPane.session.removeAllListeners();

        const focused = this.focusedPane;
        this._focusedPane = this.panes.next(focused);
        this.panes.remove(focused);
    }

    closeAllPanes(): void {
        while (this.panes.size) {
            this.closeFocusedPane();
        }
    }

    get focusedPane(): Pane {
        return this._focusedPane;
    }

    focusPane(pane: Pane): void {
        this._focusedPane = pane;
        const paneComponent = this._focusedPane.paneComponent;
        if (!paneComponent) {
            return;
        }

        const promptComponent = paneComponent.promptComponent;
        if (promptComponent) {
            promptComponent.focus();
        }
    }

    updateAllPanesDimensions(): void {
        this.panes.children.forEach(pane => pane.paneComponent.updateSessionDimensions());
    }
}
