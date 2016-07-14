import {Session} from "../shell/Session";
import {SplitDirection} from "../Enums";

export type PaneTree = Pane | PaneList;

export class Pane {
    readonly session: Session;

    constructor(session: Session) {
        this.session = session;
    }
}

export abstract class PaneList {
    readonly children: PaneTree[];

    constructor(children: PaneTree[]) {
        this.children = children;
    }

    add(newPane: Pane, existingPane: Pane, direction: SplitDirection) {
        const list = this.findListContaining(existingPane);

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

    protected abstract insertBelow(position: number, pane: Pane): void;
    protected abstract insertNextTo(position: number, pane: Pane): void;

    private findListContaining(pane: Pane): PaneList | undefined {
        const childContaining = this.children.find(child => child === pane);

        if (childContaining) {
            return this;
        }

        for (const child of this.children) {
            if (child instanceof PaneList) {
                const childListContaining = child.findListContaining(pane);
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
