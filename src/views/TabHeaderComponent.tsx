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

export enum TabHoverState {
    Nothing,
    Tab,
    Close,
}

interface State {
    hover: TabHoverState;
}

export class TabHeaderComponent extends React.Component<Props, State> {
    constructor() {
        super();
        this.state = {hover: TabHoverState.Nothing};
    }

    render() {
        return (
            <li style={css.tab(this.state.hover !== TabHoverState.Nothing, this.props.isFocused)}
                onClick={this.props.activate}
                onMouseEnter={() => this.setState({hover: TabHoverState.Tab})}
                onMouseLeave={() => this.setState({hover: TabHoverState.Nothing})}>

                <span style={css.tabClose(this.state.hover)}
                      onClick={this.props.closeHandler}
                      onMouseEnter={() => this.setState({hover: TabHoverState.Close})}
                      onMouseLeave={() => this.setState({hover: TabHoverState.Tab})}>
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
        const promptComponent = this._focusedPane.sessionComponent.promptComponent;
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
            columns: Math.floor(this.contentSize.width / css.letterWidth),
            rows: Math.floor(this.contentSize.height / css.rowHeight),
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
