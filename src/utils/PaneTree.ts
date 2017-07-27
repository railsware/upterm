import {Session} from "../shell/Session";
import {PaneComponent} from "../views/PaneComponent";
import * as _ from "lodash";

export class Pane {
    readonly session: Session;
    readonly size = 1;
    private _sessionComponent: PaneComponent;

    constructor(session: Session) {
        this.session = session;
    }

    setSessionComponent(component: PaneComponent) {
        this._sessionComponent = component;
    }

    get sessionComponent(): PaneComponent {
        return this._sessionComponent;
    }
}

export class PaneList {
    readonly children: Pane[];

    constructor(children: Pane[]) {
        this.children = children;
    }

    add(session: Session) {
        if (this.children.length < 2) {
            this.children.push(new Pane(session));
        }

        return _.last(this.children)!;
    }

    remove(pane: Pane) {
        this.children.splice(this.children.indexOf(pane), 1);
    }

    get size(): number {
        return this.children.length;
    }

    /**
     * Returns the pane previous to the 'pane' argument provided.
     */
    previous(pane: Pane): Pane {
        const index = (this.children.indexOf(pane) + this.children.length - 1) % this.children.length;
        return this.children[index];
    }

    /**
     * Returns the pane next after the 'pane' argument provided.
     */
    next(pane: Pane): Pane {
        const index = (this.children.indexOf(pane) + 1) % this.children.length;
        return this.children[index];
    }
}
