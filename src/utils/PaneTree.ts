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

    abstract addBelowCurrent(session: Session): PaneList;

    abstract addNextToCurrent(session: Session): PaneList;
}

export class ColumnList extends PaneList {
    addBelowCurrent(session: Session): PaneList {
        return new RowList([this, new Pane(session)]);
    }

    addNextToCurrent(session: Session): PaneList {
        this.children.push(new Pane(session));
        return this;
    }
}

export class RowList extends PaneList {
    addBelowCurrent(session: Session): PaneList {
        this.children.push(new Pane(session));
        return this;
    }

    addNextToCurrent(session: Session): PaneList {
        return new ColumnList([this, new Pane(session)]);
    }
}
