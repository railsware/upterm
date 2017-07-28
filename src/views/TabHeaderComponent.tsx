/* tslint:disable:no-unused-variable */
import * as React from "react";
import {Session} from "../shell/Session";
import {ApplicationComponent} from "./ApplicationComponent";
import * as css from "./css/styles";
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

                <span style={css.commandSign}>⌘</span>
                <span>{this.props.position}</span>
            </li>
        );
    }
}

export class Tab {
    readonly panes: PaneList;
    private _focusedPane: Pane;

    constructor(private application: ApplicationComponent) {
        const pane = new Pane(new Session(this.application, this.contentDimensions));

        this.panes = new PaneList([pane]);
        this._focusedPane = pane;
    }

    addPane(): void {
        const session = new Session(this.application, this.contentDimensions);

        this._focusedPane = this.panes.add(session);
    }

    closeFocusedPane(): void {
        this.focusedPane.session.jobs.forEach(job => {
            job.removeAllListeners();
            job.interrupt();
        });
        this.focusedPane.session.removeAllListeners();

        const focused = this.focusedPane;
        this._focusedPane = this.panes.previous(focused);
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
        const promptComponent = this._focusedPane.paneComponent.promptComponent;
        if (promptComponent) {
            promptComponent.focus();
        }
    }

    focusPreviousPane(): void {
        this.focusPane(this.panes.previous(this.focusedPane));
    }

    focusNextPane(): void {
        this.focusPane(this.panes.next(this.focusedPane));
    }

    updateAllPanesDimensions(): void {
        this.panes.children.forEach(pane => pane.session.dimensions = this.contentDimensions);
    }

    private get contentDimensions(): Dimensions {
        return {
            columns: Math.floor(this.contentSize.width / css.letterSize.width),
            rows: Math.floor(this.contentSize.height / css.letterSize.height),
        };
    }

    private get contentSize(): Size {
        // For tests that are run in electron-mocha
        if (typeof window === "undefined") {
            return {
                width: 0,
                height: 0,
            };
        }
        return {
            width: window.innerWidth - (2 * css.contentPadding),
            height: window.innerHeight - css.titleBarHeight - css.footerHeight,
        };
    }
}
