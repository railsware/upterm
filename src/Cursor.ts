export default class Cursor {
    private show = false;
    private blink = false;

    constructor(private position: RowColumn = { row: 0, column: 0 }) {
    }

    // TODO: Use RowColumn instead of Advancement.
    moveAbsolute(advancement: Advancement, homePosition: RowColumn): Cursor {
        if (typeof advancement.horizontal === 'number') {
            this.position.column = homePosition.column + advancement.horizontal;
        }

        if (typeof advancement.vertical === 'number') {
            this.position.row = homePosition.row + advancement.vertical;
        }

        return this;
    }

    moveRelative(advancement: Advancement): Cursor {
        var vertical = Math.max(0, this.row() + (advancement.vertical || 0));
        var horizontal = Math.max(0, this.column() + (advancement.horizontal || 0));

        this.moveAbsolute({ vertical: vertical, horizontal: horizontal }, { column: 0, row: 0 });

        return this;
    }

    getPosition(): RowColumn {
        return this.position;
    }

    column(): number {
        return this.position.column;
    }

    row(): number {
        return this.position.row;
    }

    getShow(): boolean {
        return this.show;
    }

    getBlink(): boolean {
        return this.blink;
    }

    setShow(state: boolean): void {
        this.show = state;
    }

    setBlink(state: boolean): void {
        this.blink = state;
    }
}
