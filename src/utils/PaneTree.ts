import {Session} from "../shell/Session";

export type PaneTree = Pane | PaneList;

export class Pane {
    readonly session: Session;

    constructor(session: Session) {
        this.session = session;
    }

    addBelowCurrent(session: Session): PaneTree {
        return new RowList([this, new Pane(session)]);
    }

    addNextToCurrent(session: Session): PaneTree {
        return new ColumnList([this, new Pane(session)]);
    }
}

export abstract class PaneList {
    readonly children: PaneTree[];

    constructor(children: PaneTree[]) {
        this.children = children;
    }

    abstract addBelowCurrent(pane: Pane): PaneList;

    abstract addNextToCurrent(pane: Pane): PaneList;
}

export class ColumnList extends PaneList {
    addBelowCurrent(pane: Pane): PaneList {
        return new RowList([this, pane]);
    }

    addNextToCurrent(pane: Pane): PaneList {
        this.children.push(pane);
        return this;
    }
}

export class RowList extends PaneList {
    addBelowCurrent(pane: Pane): PaneList {
        this.children.push(pane);
        return this;
    }

    addNextToCurrent(pane: Pane): PaneList {
        return new ColumnList([this, pane]);
    }
}
