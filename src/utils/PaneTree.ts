import {Session} from "../shell/Session";
import {SplitDirection} from "../Enums";
import {SessionComponent} from "../views/2_SessionComponent";
import * as _ from "lodash";

export type PaneTree = Pane | PaneList;

export class Pane {
    readonly session: Session;
    readonly size = 1;
    private _sessionComponent: SessionComponent;

    constructor(session: Session) {
        this.session = session;
    }

    setSessionComponent(component: SessionComponent) {
        this._sessionComponent = component;
    }

    sessionComponent(): SessionComponent {
        return this._sessionComponent;
    }
}

export abstract class PaneList {
    readonly children: PaneTree[];

    constructor(children: PaneTree[]) {
        this.children = children;
    }

    /**
     * Add a new pane after the existing one.
     */
    add(newPane: Pane, existingPane: Pane, direction: SplitDirection) {
        const list = this.findListWithDirectChild(existingPane);

        if (!list) {
            throw `Couldn't find a list containing the pane.`;
        }

        const insertIndex = list.children.indexOf(existingPane);

        if (direction === SplitDirection.Horizontal) {
            list.insertBelow(insertIndex, newPane);
        } else {
            list.insertNextTo(insertIndex, newPane);
        }
    }

    remove(pane: Pane) {
        const list = this.findListWithDirectChild(pane);

        if (!list) {
            throw `Couldn't find a list containing the pane.`;
        }

        list.children.splice(list.children.indexOf(pane), 1);
    }

    get size(): number {
        return _.sum(this.children.map(child => child.size));
    }

    forEach(callback: (pane: Pane, index: number) => void, counter = 0): void {
        for (const child of this.children) {
            if (child instanceof Pane) {
                callback(child, counter);
                ++counter;
            } else {
                child.forEach((pane) => {
                    callback(pane, counter);
                    ++counter;
                });
            }
        }
    }

    previous(pane: Pane): Pane {
        let paneIndex = 0;

        this.forEach((current, index) => {
            if (pane === current) {
                paneIndex = index;
            }
        });

        let previous = pane;

        this.forEach((current, index) => {
            if (index === paneIndex - 1) {
                previous = current;
            }
        });

        return previous;
    }

    next(pane: Pane): Pane {
        let paneIndex = 0;

        this.forEach((current, index) => {
            if (pane === current) {
                paneIndex = index;
            }
        });

        let next = pane;

        this.forEach((current, index) => {
            if (index === paneIndex + 1) {
                next = current;
            }
        });

        return next;
    }

    protected abstract insertBelow(position: number, pane: Pane): void;
    protected abstract insertNextTo(position: number, pane: Pane): void;

    private findListWithDirectChild(tree: PaneTree): PaneList | undefined {
        const childContaining = this.children.find(child => child === tree);

        if (childContaining) {
            return this;
        }

        for (const child of this.children) {
            if (child instanceof PaneList) {
                const childListContaining = child.findListWithDirectChild(tree);
                if (childListContaining) {
                    return childListContaining;
                }
            }
        }
    }
}

export class ColumnList extends PaneList {
    protected insertBelow(position: number, pane: Pane) {
        this.children.splice(position, 1, new RowList([this.children[position], pane]));
    }

    protected insertNextTo(position: number, pane: Pane) {
        this.children.splice(position + 1, 0, pane);
    }
}

export class RowList extends PaneList {
    protected insertBelow(position: number, pane: Pane) {
        this.children.splice(position + 1, 0, pane);
    }

    protected insertNextTo(position: number, pane: Pane) {
        this.children.splice(position, 1, new ColumnList([this.children[position], pane]));
    }
}
