import {Session} from "../shell/Session";
import {PaneComponent} from "../views/PaneComponent";

export class Pane {
    readonly session: Session;
    readonly size = 1;
    private _paneComponent: PaneComponent;

    constructor(session: Session) {
        this.session = session;
    }

    setPaneComponent(component: PaneComponent) {
        this._paneComponent = component;
    }

    get paneComponent(): PaneComponent | undefined {
        return this._paneComponent;
    }
}

export class PaneList {
    readonly children: Pane[];

    constructor(children: Pane[]) {
        this.children = children;
    }

    add(session: Session): boolean {
        if (this.children.length < 2) {
            this.children.push(new Pane(session));
            return true;
        }

        return false;
    }

    remove(pane: Pane) {
        this.children.splice(this.children.indexOf(pane), 1);
    }

    get size(): number {
        return this.children.length;
    }

    /**
     * Returns the pane next after the 'pane' argument provided.
     */
    next(pane: Pane): Pane {
        const index = (this.children.indexOf(pane) + 1) % this.children.length;
        return this.children[index];
    }
}
