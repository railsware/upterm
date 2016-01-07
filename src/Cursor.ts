export default class Cursor {
    private show = false;
    private blink = false;

    constructor(private position: RowColumn = { row: 0, column: 0 }) {
    }

    moveAbsolute(position: RowColumn, homePosition: RowColumn): Cursor {
        if (typeof position.column === 'number') {
            this.position.column = position.column + homePosition.column;
        }

        if (typeof position.row === 'number') {
            this.position.row = position.row + homePosition.row;
        }

        return this;
    }

    moveRelative(advancement: Advancement): Cursor {
        const row = Math.max(0, this.row() + (advancement.vertical || 0));
        const column = Math.max(0, this.column() + (advancement.horizontal || 0));

        this.moveAbsolute({ row: row, column: column }, { column: 0, row: 0 });

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
